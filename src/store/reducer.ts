import { PublicKey } from "@solana/web3.js";

export type Action = {
  type: ActionType;
  item: any;
};

export enum ActionType {
  CommonTriggerShutdown,
  CommonDidShutdown,
  CommonWalletDidConnect,
  CommonWalletDidDisconnect,
  CommonWalletSetProvider,
  CommonSetNetwork,
}

export default function reducer(
  state: State = initialState,
  action: Action
): State {
  let newState = {
    common: { ...state.common },
  };
  switch (action.type) {
    case ActionType.CommonWalletSetProvider:
      newState.common.walletProvider = action.item.walletProvider;
      return newState;
    case ActionType.CommonWalletDidConnect:
      newState.common.isWalletConnected = true;
      return newState;
    case ActionType.CommonWalletDidDisconnect:
      newState.common.isWalletConnected = false;
      return newState;
    case ActionType.CommonSetNetwork:
      if (newState.common.network.label !== action.item.network.label) {
        newState.common.network = action.item.network;
      }
      return newState;
    default:
      return newState;
  }
}

export type State = {
  common: CommonState;
};

export type CommonState = {
  walletProvider?: string;
  isWalletConnected: boolean;
  network: Network;
};

export const networks: Networks = {
  mainnet: {
    // Cluster.
    label: "Mainnet Beta",
    url: "https://solana-api.projectserum.com",
    explorerClusterSuffix: "",
    multisigProgramId: new PublicKey(
      "msigmtwzgXJHj2ext4XJjCDmpbcMuufFb5cHuwg6Xdt"
    ),
    multisigUpgradeAuthority: new PublicKey(
      "3uztpEgUmvirDBYRXgDamUDZiU5EcgTwArQ2pULtHJPC"
    ),
  },
  devnet: {
    // Cluster.
    label: "Devnet",
    url: "https://api.devnet.solana.com",
    explorerClusterSuffix: "devnet",
    multisigProgramId: new PublicKey(
      "81u91ekry3qovR9Pn7tAYKBRRYffkgnK3hS4ygq3bbHo"
    ),
    multisigUpgradeAuthority: new PublicKey(
      "EPJ42Bi719xTVB2T2v2NfJQSkdPdL3WmRXpX877FZVf5"
      // "D1gcX4mCZo5aB2WAKmyC4a5ZWyN8yB9GfuXBkH9K9P2z"
      // Other multisig accounts
      // "4D6S2eeRhSqQ846U8DP28PP2igzkcBRZuVCWMapq6Xmp"
      // "6TmboLphZd8xHtQqsPf3oeNyqhtfXqhbW4Vapo3WMJQ5"
    ),
  },
  // Fill in with your local cluster addresses.
  localhost: {
    // Cluster.
    label: "Localhost",
    url: "http://localhost:8899",
    explorerClusterSuffix: "localhost",
    multisigProgramId: new PublicKey(
      "9z7Pq56To96qbVLzuBcf47Lc7u8uUWZh6k5rhcaTsDjz"
    ),
  },
};

export const initialState: State = {
  common: {
    isWalletConnected: false,
    walletProvider: "https://www.sollet.io",
    network: networks.mainnet,
  },
};

type Networks = { [label: string]: Network };

export type Network = {
  // Cluster.
  label: string;
  url: string;
  explorerClusterSuffix: string;
  multisigProgramId: PublicKey;
  multisigUpgradeAuthority?: PublicKey;
};
