import * as BufferLayout from "buffer-layout";
import * as splToken from "@solana/spl-token";
import {encode as encodeBase64} from "js-base64";

export const uint64 = (property = 'uint64') => {
  return BufferLayout.blob(8, property);
};

export function parseTxData(tx: any): string {
  const ixLayout = BufferLayout.struct([
    BufferLayout.u8('instruction')
  ]);
  const ixData: any = ixLayout.decode(tx.account.data.slice(0, 8))

  if (tx.account.programId.equals(splToken.TOKEN_PROGRAM_ID)) {
    const dataLayout = BufferLayout.struct([
      BufferLayout.u8('instruction'),
      uint64('amount'),
    ]);
    const data: any = dataLayout.decode(tx.account.data)
    if (!!data && data.instruction === 3) {
        return `Transfer(${splToken.u64.fromBuffer(data.amount).toString()}) - ${ixData.instruction.toString()}`
    }
    return `Unknown Token instruction ${ixData.instruction.toString()}: ${encodeBase64(tx.account.data)}`
  }
  return `instruction code: ${ixData.instruction.toString()}, data: ${encodeBase64(tx.account.data)}`
}

