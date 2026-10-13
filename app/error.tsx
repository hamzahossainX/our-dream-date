"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="simple-page"><h1>A little pause.</h1><p>Something couldn’t load. Your unfinished choices haven’t been submitted.</p><button className="button primary" onClick={reset}>Try again</button></main>; }
