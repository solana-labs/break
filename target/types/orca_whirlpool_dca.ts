export type OrcaWhirlpoolDca = {
  "version": "0.1.0",
  "name": "orca_whirlpool_dca",
  "instructions": [
    {
      "name": "getTickArrays",
      "accounts": [
        {
          "name": "dcaThread",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [],
      "returns": {
        "defined": "clockwork_sdk::state::ThreadResponse"
      }
    }
  ]
};

export const IDL: OrcaWhirlpoolDca = {
  "version": "0.1.0",
  "name": "orca_whirlpool_dca",
  "instructions": [
    {
      "name": "getTickArrays",
      "accounts": [
        {
          "name": "dcaThread",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [],
      "returns": {
        "defined": "clockwork_sdk::state::ThreadResponse"
      }
    }
  ]
};
