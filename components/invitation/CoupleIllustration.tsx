export function CoupleIllustration() {
  return <figure className="invite-couple-moment">
    <svg viewBox="0 0 280 170" role="img" aria-labelledby="couple-title">
      <title id="couple-title">A boy offers a flower to the girl he would love to take on a date.</title>
      <ellipse cx="140" cy="152" rx="100" ry="8" fill="var(--invite-line)" opacity=".55" />
      <g className="invite-couple-boy">
        <path d="M88 112 75 142h40m-15-30 25 28h-12" fill="none" stroke="var(--invite-avatar-hair)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M85 73q-15 10-12 39l32 7 5-37Z" fill="var(--invite-avatar-shirt)" />
        <path d="m78 142-11 5m48-6 10 6" stroke="var(--invite-avatar-hair)" strokeWidth="8" strokeLinecap="round" />
        <path d="m86 74 3-13 15 1-3 17" fill="var(--invite-avatar-skin)" />
        <ellipse cx="97" cy="48" rx="19" ry="23" fill="var(--invite-avatar-skin)" />
        <path d="M78 51q-9-29 12-33 26-5 26 25-9 2-16-12-7 13-22 10Z" fill="var(--invite-avatar-hair)" />
        <path d="m101 48 2 0m8 9q-5 5-10 1" stroke="var(--invite-avatar-hair)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <g className="invite-couple-offer">
          <path d="m101 87 25 14 20-15" fill="none" stroke="var(--invite-avatar-shirt)" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m143 87 9-6" stroke="var(--invite-avatar-skin)" strokeWidth="10" strokeLinecap="round" />
          <path d="m153 85 5-24m-3 15q-12-8-11-1 3 6 11 1" fill="none" stroke="var(--invite-leaf)" strokeWidth="3" strokeLinecap="round" />
          <g fill="var(--invite-flower-petal)"><circle cx="157" cy="58" r="7" /><circle cx="165" cy="61" r="7" /><circle cx="159" cy="68" r="7" /><circle cx="150" cy="64" r="7" /></g>
          <circle cx="157" cy="63" r="4" fill="var(--invite-paper)" />
        </g>
      </g>
      <g className="invite-couple-girl">
        <path d="m184 122-4 24m19-23 3 23" stroke="var(--invite-avatar-skin)" strokeWidth="9" strokeLinecap="round" />
        <path d="m180 147-8 3m30-3 9 3" stroke="var(--invite-avatar-hair)" strokeWidth="7" strokeLinecap="round" />
        <path d="M170 37q-4-29 20-29 29 0 23 45l-6 32-37-3Z" fill="var(--invite-avatar-hair)" />
        <path d="m181 57 1 14 17 1-2-18" fill="var(--invite-avatar-skin)" />
        <path d="M180 69q-12 6-10 27l-12 29q34 12 62-1l-15-31q3-20-11-24Z" fill="var(--invite-accent)" />
        <ellipse cx="191" cy="38" rx="17" ry="22" fill="var(--invite-avatar-skin)" />
        <path d="M174 38q-3-26 17-26 17 0 20 24-16-1-24-13-2 10-13 15Z" fill="var(--invite-avatar-hair)" />
        <path d="m181 39 2 0m11 0 2 0m-11 11q5 4 10-1" stroke="var(--invite-avatar-hair)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="m173 82-9 9-10-5m49-6 5 19" stroke="var(--invite-avatar-skin)" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="178" cy="47" r="3" fill="var(--invite-flower-petal)" /><circle cx="202" cy="45" r="3" fill="var(--invite-flower-petal)" />
      </g>
      <g className="invite-couple-heart" fill="var(--invite-rose-soft)"><path d="M139 35c-17-11-13-22-6-22 4 0 6 3 6 6 1-3 3-6 7-6 7 0 11 11-7 22Z" /></g>
      <path className="invite-couple-sparkle" d="m230 48 3-9 3 9 9 3-9 3-3 9-3-9-9-3Z" fill="var(--invite-envelope-deep)" />
    </svg>
    <figcaption>A little courage. A whole lot of love.</figcaption>
  </figure>;
}
