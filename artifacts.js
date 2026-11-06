// ABI of the deployed VestFlow contract (native BOT version) on BOT Chain mainnet.
// The empty create() and vested() overloads are left out on purpose: they clash with the real create(...) and vested(uint256).
window.ARTIFACTS = {
  main: {
    abi: [
      "function schedules(uint256) view returns (address creator, address beneficiary, uint256 total, uint256 released, uint64 start, uint64 cliff, uint64 duration, bool revoked)",
      "function scheduleCount() view returns (uint256)",
      "function idsOf(address a) view returns (uint256[])",
      "function vested(uint256 id) view returns (uint256)",
      "function releasable(uint256 id) view returns (uint256)",
      "function create(address beneficiary, uint64 cliffSecs, uint64 durationSecs) payable returns (uint256 id)",
      "function release(uint256 id)",
      "function revoke(uint256 id)",
      "event Created(uint256 indexed id, address indexed creator, address indexed beneficiary, uint256 amount)",
      "event Released(uint256 indexed id, uint256 amount)",
      "event Revoked(uint256 indexed id, uint256 refunded)"
    ]
  }
};