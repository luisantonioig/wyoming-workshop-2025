use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use aiken/interval.{Finite, IntervalBound}
use cardano/transaction.{OutputReference, Transaction, ValidityRange}

pub type VestingDatum {
  lock_until: Int,
  owner: VerificationKeyHash,
}

validator vesting {
  spend(
    datum_opt: Option<VestingDatum>,
    _redeemer: Data,
    _utxo: OutputReference,
    tx: Transaction,
  ) {
    expect Some(datum) = datum_opt
    and {
      list.has(tx.extra_signatories, datum.owner),
      valid_after(tx.validity_range, datum.lock_until),
    }
  }

  else(_) {
    fail
  }
}

pub fn valid_after(
  validity_range: ValidityRange,
  required_timestamp: Int,
) -> Bool {
  let IntervalBound { bound_type, is_inclusive } = validity_range.lower_bound
  when (bound_type, is_inclusive) is {
    (Finite(lower_bound), True) -> lower_bound > required_timestamp
    (Finite(lower_bound), False) -> lower_bound >= required_timestamp
    _ -> False
  }
}
