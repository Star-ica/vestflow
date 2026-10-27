// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "./Token.sol";

/// @title VestFlow - token vesting with a cliff and linear release. The creator can revoke unvested tokens.
contract VestFlow {
    IERC20 public immutable token;

    struct Schedule {
        address creator;
        address beneficiary;
        uint256 total;
        uint256 released;
        uint64 start;
        uint64 cliff;     // seconds after start before anything vests
        uint64 duration;  // seconds until fully vested
        bool revoked;
    }
    Schedule[] public schedules;
    mapping(address => uint256[]) private _ids;

    event Created(uint256 indexed id, address indexed creator, address indexed beneficiary, uint256 amount);
    event Released(uint256 indexed id, uint256 amount);
    event Revoked(uint256 indexed id, uint256 refunded);

    constructor(address _token) { token = IERC20(_token); }

    function scheduleCount() external view returns (uint256) { return schedules.length; }
    function idsOf(address a) external view returns (uint256[] memory) { return _ids[a]; }

    function create(address beneficiary, uint256 amount, uint64 cliffSecs, uint64 durationSecs) external returns (uint256 id) {
        require(beneficiary != address(0) && amount > 0 && durationSecs > 0 && cliffSecs <= durationSecs, "bad params");
        require(token.transferFrom(msg.sender, address(this), amount), "transfer");
        schedules.push(Schedule(msg.sender, beneficiary, amount, 0, uint64(block.timestamp), cliffSecs, durationSecs, false));
        id = schedules.length - 1;
        _ids[beneficiary].push(id);
        emit Created(id, msg.sender, beneficiary, amount);
    }

    function vested(uint256 id) public view returns (uint256) {
        Schedule memory s = schedules[id];
        if (s.revoked) return s.total;
        if (block.timestamp < uint256(s.start) + s.cliff) return 0;
        uint256 elapsed = block.timestamp - s.start;
        if (elapsed >= s.duration) return s.total;
        return (s.total * elapsed) / s.duration;
    }
    function releasable(uint256 id) public view returns (uint256) { return vested(id) - schedules[id].released; }

    function release(uint256 id) external {
        Schedule storage s = schedules[id];
        require(msg.sender == s.beneficiary, "beneficiary only");
        uint256 amount = releasable(id);
        require(amount > 0, "nothing releasable");
        s.released += amount;
        require(token.transfer(s.beneficiary, amount), "transfer");
        emit Released(id, amount);
    }
    function revoke(uint256 id) external {
        Schedule storage s = schedules[id];
        require(msg.sender == s.creator, "creator only");
        require(!s.revoked, "already revoked");
        uint256 v = vested(id);
        uint256 refund = s.total - v;
        s.total = v;
        s.revoked = true;
        if (refund > 0) require(token.transfer(s.creator, refund), "transfer");
        emit Revoked(id, refund);
    }
}
