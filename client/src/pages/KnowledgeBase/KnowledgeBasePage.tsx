import { useState } from "react";
import { ArrowRight, BookOpen, ChevronRight, FileQuestion, Search, X } from "lucide-react";
import { knowledgeArticles, knowledgeCategories, type KnowledgeArticle, type KnowledgeCategory } from "@/data/mock/knowledge-base";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type CategoryFilter = KnowledgeCategory | "All topics";

export function KnowledgeBasePage() {
  const [category, setCategory] = useState<CategoryFilter>("All topics");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<KnowledgeArticle | null>(null);
  const search = query.trim().toLowerCase();
  const visible = knowledgeArticles.filter(article =>
    (category === "All topics" || article.category === category) &&
    `${article.title} ${article.summary} ${article.body} ${article.category}`.toLowerCase().includes(search)
  );

  return (
    <section className="kb-page">
      <header className="kb-hero">
        <div className="kb-hero-copy">
          <span className="eyebrow">SUPPORT / KNOWLEDGE BASE</span>
          <h1>How can we help?</h1>
          <p>Practical guides for the workflows you use every day.</p>
          <label className="kb-search">
            <Search size={19} />
            <input aria-label="Search help articles" placeholder="Search articles, workflows, or topics…" value={query} onChange={event => setQuery(event.target.value)} />
            {query && <button aria-label="Clear search" onClick={() => setQuery("")}><X size={16} /></button>}
          </label>
          <span className="kb-hero-hint">Try “part request”, “compliance”, or “hours”</span>
        </div>
        <div className="kb-hero-art" aria-hidden="true"><BookOpen size={68} strokeWidth={1.1} /><span>WINGBOX / GUIDE</span></div>
      </header>
      <div className="kb-layout">
        <aside className="kb-topics panel" aria-label="Help topics">
          <h2>Browse topics</h2>
          {(["All topics", ...knowledgeCategories] as CategoryFilter[]).map(topic => (
            <button key={topic} className={category === topic ? "active" : ""} onClick={() => setCategory(topic)}>
              <span>{topic}</span><em>{topic === "All topics" ? knowledgeArticles.length : knowledgeArticles.filter(article => article.category === topic).length}</em>
            </button>
          ))}
        </aside>
        <main className="kb-results panel">
          <div className="kb-results-head"><div><span className="eyebrow">HELP ARTICLES</span><h2>{search ? `Search results for “${query.trim()}”` : category === "All topics" ? "All articles" : category}</h2></div><span>{visible.length} articles</span></div>
          {visible.length ? <div className="kb-article-list">{visible.map(article => (
            <button key={article.id} className="kb-article" onClick={() => setSelected(article)}>
              <span className="kb-article-icon"><FileQuestion size={18} /></span>
              <span className="kb-article-copy"><small>{article.category}</small><strong>{article.title}</strong><span>{article.summary}</span></span>
              <ChevronRight size={18} />
            </button>
          ))}</div> : <div className="kb-empty"><Search size={25} /><h3>No matching articles</h3><p>Try a different search or browse all topics.</p><button onClick={() => { setQuery(""); setCategory("All topics"); }}>Show all articles <ArrowRight size={14} /></button></div>}
        </main>
      </div>
      <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
        <DialogContent className="kb-dialog">
          <DialogHeader><span className="eyebrow">{selected?.category}</span><DialogTitle>{selected?.title}</DialogTitle><DialogDescription>{selected?.summary}</DialogDescription></DialogHeader>
          <p>{selected?.body}</p>
          <div className="kb-dialog-foot"><span>WingBox OS Help</span><button onClick={() => setSelected(null)}>Back to articles</button></div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
