// @flow
import Prando from "prando";
import { BigNumber } from "bignumber.js";
import type { Account, Operation, OperationType } from "../../types";
import type {} from "./types";

import { genHex, genAddress } from "../../mock/helpers";

function setAlgorandResources(account: Account): Account {
  /** format algorandResources given the new delegations */
  account.algorandResources = {
    rewards: account.balance.multipliedBy(0.01),
    rewardsAccumulated: account.balance.multipliedBy(0.1),
  };

  return account;
}

function genBaseOperation(
  account: Account,
  rng: Prando,
  type: OperationType,
  index: number
): Operation {
  const { operations: ops } = account;

  const address = genAddress(account.currency, rng);

  const lastOp = ops[index];
  const date = new Date(
    (lastOp ? lastOp.date.valueOf() : Date.now()) -
      rng.nextInt(0, 100000000 * rng.next() * rng.next())
  );

  const hash = genHex(64, rng);
  /** generate given operation */
  return {
    id: String(`mock_op_${ops.length}_${type}_${account.id}`),
    hash,
    type,
    value: BigNumber(0),
    fee: BigNumber(0),
    senders: [address],
    recipients: [address],
    blockHash: genHex(64, rng),
    blockHeight: account.blockHeight - Math.floor((Date.now() - date) / 900000),
    accountId: account.id,
    date,
    extra: {
      rewards: BigNumber(0),
      memo: "memo",
    },
  };
}

function addOptIn(account: Account, rng: Prando): Account {
  /** select position on the operation stack where we will insert the new claim rewards */
  const opIndex = rng.next(0, 10);
  const opt = genBaseOperation(account, rng, "OPT_IN", opIndex);

  opt.extra = {
    ...opt.extra,
    rewards: BigNumber(0),
    assetId: "Thether",
  };

  account.operations.splice(opIndex, 0, opt);
  account.operationsCount++;

  return account;
}

function addOptOut(account: Account, rng: Prando): Account {
  /** select position on the operation stack where we will insert the new claim rewards */
  const opIndex = rng.next(0, 10);
  const opt = genBaseOperation(account, rng, "OPT_OUT", opIndex);

  opt.extra = {
    ...opt.extra,
    rewards: BigNumber(0),
    assetId: "Thether",
  };

  account.operations.splice(opIndex, 0, opt);
  account.operationsCount++;

  return account;
}

function addCloseAccount(account: Account, rng: Prando): Account {
  /** select position on the operation stack where we will insert the new claim rewards */
  const opIndex = rng.next(0, 10);
  const opt = genBaseOperation(account, rng, "CLOSE_ACCOUNT", opIndex);

  account.operations.splice(opIndex, 0, opt);
  account.operationsCount++;

  return account;
}

/**
 * add in specific algorand operations
 * @memberof algorand/mock
 * @param {Account} account
 * @param {Prando} rng
 */
function genAccountEnhanceOperations(account: Account, rng: Prando): Account {
  addOptIn(account, rng);
  addOptOut(account, rng);
  addCloseAccount(account, rng);
  setAlgorandResources(account);
  return account;
}

/**
 * Update spendable balance for the account based on delegation data
 * @memberof algorand/mock
 * @param {Account} account
 */
function postSyncAccount(account: Account): Account {
  const algorandResources = account.algorandResources || {};
  const rewards = algorandResources.rewards || BigNumber(0);

  account.spendableBalance = account.balance.plus(rewards);

  return account;
}

/**
 * post account scan data logic
 * clears account algorand resources if supposed to be empty
 * @memberof algorand/mock
 * @param {Account} account
 */
function postScanAccount(
  account: Account,
  { isEmpty }: { isEmpty: boolean }
): Account {
  if (isEmpty) {
    account.algorandResources = {
      rewards: BigNumber(0),
      rewardsAccumulated: BigNumber(0),
    };
    account.operations = [];
    account.subAccounts = [];
  }

  return account;
}

export default {
  genAccountEnhanceOperations,
  postSyncAccount,
  postScanAccount,
};
