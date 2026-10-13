import Link from "next/link";
import { ArrowLeft, ArrowRight, Heart, Mail, Sparkles } from "lucide-react";

export default function About() {
  return <main className="about-page">
    <Link className="text-button" href="/"><ArrowLeft size={17} /> Back to the invitation</Link>
    <article className="about-letter">
      <span className="auth-heart"><Heart size={30} /></span>
      <p className="eyebrow">OUR DREAM DATE</p>
      <h1>A little website.<br /><em>A lovely way to ask.</em></h1>
      <p>Made for a friend to surprise his favourite person. A wife, a girlfriend, a partner — someone who makes an ordinary day feel special.</p>
      <p>Open the letter, choose a little adventure, and leave a note. The best part of the plan is the person you share it with.</p>
      <div className="about-detail"><Mail size={21} /><div><h2>Try the invitation</h2><p>The browser demo keeps your completed reply on this device. Download the reply and share it with your partner when you’re ready.</p></div></div>
      <div className="about-detail"><Sparkles size={21} /><div><h2>Take a look behind the scenes</h2><p>The admin demo shows fictional replies and lets you try the controls. Real private invitations use a separate owner dashboard.</p></div></div>
      <div className="about-actions"><Link className="button primary" href="/demo">Open the letter <Heart size={16} /></Link><Link className="button secondary" href="/admin/login">Try the admin demo <ArrowRight size={16} /></Link></div>
      <p className="about-signoff">A little time. A lot of us.</p>
    </article>
  </main>;
}
