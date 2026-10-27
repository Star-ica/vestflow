// Edit address to point this front end at an existing deployment.
window.APP_CONFIG = {
  "address": "",
  "slug": "vestflow",
  "name": "VestFlow",
  "accent": "#7a3fb0",
  "tagline": "Lock tokens with a cliff and release them linearly.",
  "about": "Create a schedule for any address. Nothing unlocks before the cliff, then tokens vest evenly until the end. The creator can revoke what has not vested yet.",
  "tokens": [
    "token"
  ],
  "deploy": {
    "tokens": [
      {
        "name": "Vesting Token",
        "symbol": "VST"
      }
    ],
    "args": [
      "$t0"
    ]
  },
  "amountFields": [
    "total",
    "released"
  ],
  "timeFields": [
    "start"
  ],
  "stats": [
    {
      "label": "Schedules",
      "fn": "scheduleCount",
      "fmt": "raw"
    },
    {
      "label": "Your schedule IDs",
      "fn": "idsOf",
      "fmt": "list",
      "args": [
        "me"
      ]
    }
  ],
  "actions": [
    {
      "title": "Create schedule",
      "fn": "create",
      "inputs": [
        {
          "id": "b",
          "label": "Beneficiary",
          "type": "address",
          "meDefault": false
        },
        {
          "id": "amount",
          "label": "Amount",
          "type": "amount",
          "default": "100"
        },
        {
          "id": "cliff",
          "label": "Cliff (seconds)",
          "type": "uint",
          "default": "60"
        },
        {
          "id": "dur",
          "label": "Duration (seconds)",
          "type": "uint",
          "default": "600"
        }
      ]
    },
    {
      "title": "Release vested tokens",
      "fn": "release",
      "desc": "Beneficiary only.",
      "inputs": [
        {
          "id": "id",
          "label": "Schedule ID",
          "type": "uint",
          "default": "0"
        }
      ]
    },
    {
      "title": "Revoke schedule",
      "fn": "revoke",
      "desc": "Creator only. Returns unvested tokens.",
      "inputs": [
        {
          "id": "id",
          "label": "Schedule ID",
          "type": "uint",
          "default": "0"
        }
      ]
    }
  ],
  "views": [
    {
      "title": "Schedule details",
      "fn": "schedules",
      "inputs": [
        {
          "id": "id",
          "label": "Schedule ID",
          "type": "uint",
          "default": "0"
        }
      ]
    },
    {
      "title": "Vested so far",
      "fn": "vested",
      "inputs": [
        {
          "id": "id",
          "label": "Schedule ID",
          "type": "uint",
          "default": "0"
        }
      ]
    },
    {
      "title": "Releasable now",
      "fn": "releasable",
      "inputs": [
        {
          "id": "id",
          "label": "Schedule ID",
          "type": "uint",
          "default": "0"
        }
      ]
    }
  ]
};
