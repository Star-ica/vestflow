// BOT Chain mainnet deployment
window.APP_CONFIG = {
  "address": "0x485fAEa55399873424948F12F6ddD5b56D1675A5",
  "slug": "vestflow",
  "name": "VestFlow",
  "accent": "#7a3fb0",
  "tagline": "Lock BOT with a cliff and release it linearly.",
  "about": "Create a BOT vesting schedule for any address. Nothing unlocks before the cliff, then BOT vests evenly until the end. The creator can revoke what has not vested yet.",
  "tokens": [],
  "amountFields": ["total", "released"],
  "timeFields": ["start"],
  "stats": [
    { "label": "Schedules", "fn": "scheduleCount", "fmt": "raw" },
    { "label": "Schedule IDs for you", "fn": "idsOf", "fmt": "list", "args": ["me"] }
  ],
  "actions": [
    {
      "title": "Create schedule",
      "fn": "create",
      "desc": "Locks this much BOT for the beneficiary. Cliff and duration count from now.",
      "valueInput": "amount",
      "inputs": [
        { "id": "b", "label": "Beneficiary", "type": "address", "meDefault": false },
        { "id": "amount", "label": "BOT amount", "type": "amount", "default": "100" },
        { "id": "cliff", "label": "Cliff (days)", "type": "days", "default": "30" },
        { "id": "dur", "label": "Total duration (days)", "type": "days", "default": "365" }
      ]
    },
    {
      "title": "Release vested BOT",
      "fn": "release",
      "desc": "Beneficiary only.",
      "inputs": [ { "id": "id", "label": "Schedule ID", "type": "uint", "default": "0" } ]
    },
    {
      "title": "Revoke schedule",
      "fn": "revoke",
      "desc": "Creator only. Returns BOT that has not vested yet.",
      "inputs": [ { "id": "id", "label": "Schedule ID", "type": "uint", "default": "0" } ]
    }
  ],
  "views": [
    { "title": "Schedule details", "fn": "schedules", "desc": "cliff and duration are in seconds.", "inputs": [ { "id": "id", "label": "Schedule ID", "type": "uint", "default": "0" } ] },
    { "title": "Vested so far", "fn": "vested", "fmt": "token", "inputs": [ { "id": "id", "label": "Schedule ID", "type": "uint", "default": "0" } ] },
    { "title": "Releasable now", "fn": "releasable", "fmt": "token", "inputs": [ { "id": "id", "label": "Schedule ID", "type": "uint", "default": "0" } ] },
    { "title": "Schedule IDs of an address", "fn": "idsOf", "fmt": "list", "inputs": [ { "id": "a", "label": "Beneficiary", "type": "address", "meDefault": true } ] }
  ]
};