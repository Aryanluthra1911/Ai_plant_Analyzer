'use client';

export default function ApplicationError({ reset }) {
  return <div className="page-wrap"><span className="eyebrow">A temporary hiccup</span><h1 className="page-title serif">This page could not load.</h1><p className="subtle">Your saved garden information is unchanged. Please try again.</p><button className="button" type="button" onClick={reset}>Try again</button></div>;
}
