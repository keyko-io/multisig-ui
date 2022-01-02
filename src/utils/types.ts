import * as BufferLayout from "buffer-layout";
import * as splToken from "@solana/spl-token";
import {encode as encodeBase64} from "js-base64";
import * as SplToken from "@solana/spl-token";
import {SWAP_PROGRAM_ID} from "../components/Multisig";
import {AccountLayout, MintInfo} from "@solana/spl-token";
import {
  Connection,
  Signer,
  PublicKey,
} from "@solana/web3.js";

export const uint64 = (property = 'uint64') => {
  return BufferLayout.blob(8, property);
};

export type DataItem = {
  name: string,
  value: string
}

export type InstructionInfo = {
  type: string,
  name: string,
  code: number,
  dataItems: DataItem[],
  data: any,
  otherInfo: string
}

export async function getMintInfo(connection: Connection, tokenAccount: PublicKey, signer: Signer): Promise<MintInfo | null> {
  const accInfo = await connection.getAccountInfo(tokenAccount, "recent")
  if (accInfo) {
    const mint = new PublicKey(AccountLayout.decode(Buffer.from(accInfo.data)).mint)
    console.log("mint: " + mint.toString())
    const tok = new SplToken.Token(connection, mint, SplToken.TOKEN_PROGRAM_ID, signer)
    return tok.getMintInfo()
  }
  return null
}

export function formatInstructionData(instInfo: InstructionInfo): string {
  if (instInfo.name !== 'unsupported') {
    let argValues = instInfo.dataItems.map((ditem: DataItem) => {
      return `${ditem.name}=${ditem.value}`
    })
    return `${instInfo.name}: ` + argValues.join(', ')
  }
  return `${instInfo.name}: data=${instInfo.data.toString()}`
}

export function parseTxData(tx: any, decimalsList?: number[]): InstructionInfo {
  if (decimalsList === undefined) {
    decimalsList = [6, 6, 6, 6]
  }

  if (tx.account.programId.equals(SplToken.TOKEN_PROGRAM_ID)) {
    const dataLayout = BufferLayout.struct([
      BufferLayout.u8('instruction'),
      uint64('amount'),
    ]);
    const ixData: any = dataLayout.decode(tx.account.data)
    if (!!ixData && ixData.instruction === 3) {
        return {
          type: 'Token', name: 'transfer', code: ixData.instruction,
          dataItems: [
            {name: 'amount', value: (splToken.u64.fromBuffer(ixData.amount).toNumber() / (10 ** decimalsList[0])).toString()}
          ],
          data: encodeBase64(tx.account.data),
          otherInfo: `receiver=${tx.account.accounts[1].pubkey.toString()}`
        } as InstructionInfo
    }
    return {
      type: 'Token', name: 'unsupported', code: ixData.instruction,
      dataItems: [], data: encodeBase64(tx.account.data), otherInfo: ''} as InstructionInfo
  }

  if (tx.account.programId.equals(SWAP_PROGRAM_ID)) {
    const dataLayout = BufferLayout.struct<{
      instruction: number;
      value1: Uint8Array;
      value2: Uint8Array;
      value: Uint8Array;
    }>([
      BufferLayout.u8("instruction"),
      uint64("value1"),
      uint64("value2"),
      uint64("value3"),
    ]);

    const data: any = dataLayout.decode(tx.account.data)
    if (!data || !data.instruction) {
      return {
        type: 'Saber swap', name: 'unsupported', code: data.instruction,
        dataItems: [], data: encodeBase64(tx.account.data),
        otherInfo: `swapAccount=${tx.account.accounts[0].pubkey.toString()}`} as InstructionInfo
    } else {
      if (data.instruction === 2) { //saber.StableSwapInstruction.DEPOSIT) {
        const tokenAmountA = splToken.u64.fromBuffer(data.value1).toNumber() / (10 ** decimalsList[1])
        const tokenAmountB = splToken.u64.fromBuffer(data.value2).toNumber() / (10 ** decimalsList[2])
        const minimumPoolTokenAmount = splToken.u64.fromBuffer(data.value3).toNumber() / (10 ** decimalsList[3])
        const dataItems = [
          {name: 'tokenAmountA', value: tokenAmountA.toString()},
          {name: 'tokenAmountB', value: tokenAmountB.toString()},
          {name: 'minimumPoolTokenAmount', value: minimumPoolTokenAmount.toString()}
        ]
        return {
          type: 'Saber swap', name: 'deposit', code: data.instruction,
          dataItems, data: encodeBase64(tx.account.data),
          otherInfo: `swapAccount=${tx.account.accounts[0].pubkey.toString()}`} as InstructionInfo
      }
      if (data.instruction === 3) { //saber.StableSwapInstruction.WITHDRAW) {
        const poolTokenAmount = splToken.u64.fromBuffer(data.value1).toNumber() / (10 ** decimalsList[3])
        const minimumTokenA = splToken.u64.fromBuffer(data.value2).toNumber() / (10 ** decimalsList[1])
        const minimumTokenB = splToken.u64.fromBuffer(data.value3).toNumber() / (10 ** decimalsList[2])
        const dataItems = [
          {name: 'poolTokenAmount', value: poolTokenAmount.toString()},
          {name: 'minimumTokenA', value: minimumTokenA.toString()},
          {name: 'minimumTokenB', value: minimumTokenB.toString()}
        ]
        return {
          type: 'Saber swap', name: 'withdraw', code: data.instruction,
          dataItems, data: encodeBase64(tx.account.data),
          otherInfo: `swapAccount=${tx.account.accounts[0].pubkey.toString()}`} as InstructionInfo
      }
      return {
        type: 'Saber swap', name: 'unsupported', code: data.instruction,
        dataItems: [], data: encodeBase64(tx.account.data),
        otherInfo: `swapAccount=${tx.account.accounts[0].pubkey.toString()}`} as InstructionInfo
    }
  }
  return {
    type: 'Unknown', name: 'unsupported', code: -1,
    dataItems: [], data: encodeBase64(tx.account.data), otherInfo: ''} as InstructionInfo

}

