# Invitation rules

An invitation is Fahim's editable gift. A published version freezes the questions, choices, scheduling rules, and presentation used for a submission. A recipient invite is one private link to that invitation. A response is one explicitly confirmed, complete answer.

- Yes requires a date/time permitted by the published configuration and the required applicable question answers. No is a valid complete response with no date or time requirement. Questions may apply to Yes, No, or both; a required decline question applies only when configured for that branch.
- The note is optional plain text, bounded by configuration. Empty text is valid. HTML is never accepted as presentation content.
- Single-select questions allow at most one enabled choice. Multi-select questions enforce configured minimum and maximum counts. Option IDs must belong to their question and published version.
- Date rules use the invitation timezone, initially Asia/Dhaka. Past local dates and past or disabled slots are invalid. A selected date is distinct from the UTC submission timestamp.
- Drafts stay in page memory. Back/edit works before submission; refreshing loses an incomplete draft. Nothing is saved merely because a step was completed.
- One recipient invite permits one final response. The database, not IP address or browser storage, enforces that rule. A network retry returns the authorized existing receipt.
- Responses preserve a snapshot of labels and selected IDs. Publishing later edits never changes the meaning of an earlier answer.
- No remains reachable by pointer, touch, and keyboard. Romantic reactions may decorate the choice but must not obstruct it.
- Deleting a response removes its content but does not reopen the invite. The completion marker remains. A new recipient invite is the default way to invite another completion.
- An admin is a provisioned Supabase Auth user with an explicit invitation membership. Authentication alone does not grant admin rights. The recipient never needs an account.
- Statistics describe currently retained complete responses only. Test fixtures are identified as tests; visits and abandoned forms are not measured.

The private link is a bearer capability: anyone who receives it can use it. It is not proof of the wife's identity. It must be revocable, excluded from logs/exports, and exchanged for a scoped session before normal browsing.
