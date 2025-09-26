use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use aiken/interval
use cardano/transaction.{OutputReference, Transaction}

pub type VestingDatum {
  /// POSIX time in milliseconds, e.g. 1672843961000
  lock_until: Int,
  /// Owner's credentials
  owner: VerificationKeyHash,
  /// Beneficiary's credentials
  beneficiary: VerificationKeyHash,
}

validator vesting {
  // In principle, scripts can be used for different purpose (e.g. minting
  // assets). Here we make sure it's only used when 'spending' from a eUTxO
  spend(
    datum_opt: Option<VestingDatum>,
    _redeemer: Data,
    _input: OutputReference,
    tx: Transaction,
  ) {
    expect Some(datum) = datum_opt
    or {
      list.has(tx.extra_signatories, datum.owner),
      and {
        list.has(tx.extra_signatories, datum.beneficiary),
        interval.is_entirely_after(tx.validity_range, datum.lock_until),
      },
    }
  }

  else(_) {
    fail
  }
}
