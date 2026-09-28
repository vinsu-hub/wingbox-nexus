import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CloudUpload,
  Cog,
  Eye,
  FileText,
  FolderOpen,
  HelpCircle,
  History,
  PlusSquare,
  Search,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { aircraft } from "@/data/aircraft";
import {
  documentCategories,
  featuredTechnicalDocument,
  technicalDocuments,
  type DocumentCategory,
  type TechnicalDocument,
  type TechnicalDocumentType,
} from "@/data/mock/technical-library";
import {
  FilterableTable,
  type TableColumn,
} from "@/components/shared/FilterableTable";
import { SidePanel } from "@/components/shared/SideRail";
import featuredEngine from "./featured-engine.jpg";

const categoryIcons = [BookOpen, Cog, Wrench, FileText, ShieldCheck];
const documentTypes: TechnicalDocumentType[] = [
  "Manual",
  "Procedure",
  "SB",
  "Drawing",
  "Guide",
];
const pageSize = 8;
const formattedDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
const categoryCount = (category: DocumentCategory) =>
  technicalDocuments.filter(document => document.category === category).length;
const unavailable = (action: string) =>
  toast.info(`${action} is coming soon.`, {
    description: "This demo does not save or open library documents yet.",
  });

export function TechnicalLibraryPage() {
  const [search, setSearch] = useState("");
  const [tail, setTail] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState<DocumentCategory | "">("");
  const [page, setPage] = useState(1);
  const selectCategory = (next: DocumentCategory | "") => {
    setCategory(next);
    setPage(1);
  };
  const filtered = technicalDocuments.filter(document => {
    const query = search.trim().toLowerCase();
    return (
      (!tail || document.tail === tail) &&
      (!type || document.type === type) &&
      (!category || document.category === category) &&
      `${document.title} ${document.subtitle} ${document.documentNumber} ${document.aircraftType} ${document.tail} ${document.category} ${document.type}`
        .toLowerCase()
        .includes(query)
    );
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const visiblePages = Array.from(
    { length: pageCount },
    (_, index) => index + 1
  ).filter(
    number =>
      number === 1 ||
      number === pageCount ||
      Math.abs(number - currentPage) <= 1
  );
  const columns: TableColumn<TechnicalDocument>[] = [
    {
      key: "title",
      header: "Title",
      render: document => (
        <div className="technical-document-title">
          <span
            className={`technical-file-icon technical-file-${document.type.toLowerCase()}`}
          >
            <FileText size={17} />
          </span>
          <div>
            <strong>{document.title}</strong>
            <small>{document.subtitle}</small>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: document => (
        <span
          className={`technical-type technical-type-${document.type.toLowerCase()}`}
        >
          {document.type}
        </span>
      ),
    },
    {
      key: "aircraft",
      header: "Aircraft",
      render: document => (
        <span>
          {document.aircraftType}
          <small>{document.tail}</small>
        </span>
      ),
    },
    {
      key: "number",
      header: "Document No.",
      render: document => document.documentNumber,
    },
    {
      key: "revision",
      header: "Revision",
      render: document => document.revision,
    },
    {
      key: "updated",
      header: "Date Updated",
      render: document => formattedDate(document.updatedAt),
    },
    {
      key: "actions",
      header: "Actions",
      render: document => (
        <button
          className="technical-view-button"
          onClick={() => unavailable(`View ${document.title}`)}
          aria-label={`View ${document.title}`}
        >
          <Eye size={14} /> View
        </button>
      ),
    },
  ];

  return (
    <div className="technical-page">
      <div className="technical-layout">
        <main className="technical-main">
          <div className="technical-breadcrumb">
            Technical <span>/</span> Technical Library
          </div>
          <div className="page-heading">
            <div>
              <h1>Technical Library</h1>
              <p>
                Access approved manuals, service bulletins, and technical
                references for all aircraft and systems.
              </p>
            </div>
          </div>
          <div
            className="technical-category-cards"
            aria-label="Document categories"
          >
            {documentCategories.map((name, index) => {
              const Icon = categoryIcons[index];
              return (
                <button
                  key={name}
                  className={`technical-category-card${category === name ? " active" : ""}`}
                  aria-pressed={category === name}
                  onClick={() => selectCategory(category === name ? "" : name)}
                >
                  <Icon size={24} />
                  <span>
                    <strong>{name}</strong>
                    <small>{categoryCount(name)} documents</small>
                  </span>
                  <ArrowRight size={14} className="technical-card-arrow" />
                </button>
              );
            })}
          </div>
          <div className="technical-table panel">
            <FilterableTable
              columns={columns}
              rows={rows}
              getRowId={document => document.id}
              emptyMessage="No documents match these filters. Try another search or category."
              filters={
                <>
                  <div className="technical-filters">
                    <label className="table-search">
                      <Search size={16} />
                      <input
                        aria-label="Search documents"
                        placeholder="Search by title, document number, keyword..."
                        value={search}
                        onChange={event => {
                          setSearch(event.target.value);
                          setPage(1);
                        }}
                      />
                    </label>
                    <label>
                      Aircraft
                      <select
                        aria-label="Aircraft"
                        value={tail}
                        onChange={event => {
                          setTail(event.target.value);
                          setPage(1);
                        }}
                      >
                        <option value="">All Aircraft</option>
                        {aircraft.map(plane => (
                          <option key={plane.tail} value={plane.tail}>
                            {plane.tail} · {plane.type}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Document Type
                      <select
                        aria-label="Document Type"
                        value={type}
                        onChange={event => {
                          setType(event.target.value);
                          setPage(1);
                        }}
                      >
                        <option value="">All Types</option>
                        {documentTypes.map(value => (
                          <option key={value}>{value}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Category
                      <select
                        aria-label="Category"
                        value={category}
                        onChange={event =>
                          selectCategory(
                            event.target.value as DocumentCategory | ""
                          )
                        }
                      >
                        <option value="">All Categories</option>
                        {documentCategories.map(value => (
                          <option key={value}>{value}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div
                    className="technical-tabs"
                    aria-label="Document category tabs"
                  >
                    <button
                      className={!category ? "active" : ""}
                      aria-pressed={!category}
                      onClick={() => selectCategory("")}
                    >
                      All Documents
                    </button>
                    {documentCategories.map(name => (
                      <button
                        key={name}
                        className={category === name ? "active" : ""}
                        aria-pressed={category === name}
                        onClick={() => selectCategory(name)}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </>
              }
              footer={
                <div className="table-footer">
                  <span role="status">
                    Showing{" "}
                    {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–
                    {Math.min(currentPage * pageSize, filtered.length)} of{" "}
                    {filtered.length} documents
                  </span>
                  <div className="pagination">
                    <button
                      aria-label="Previous page"
                      disabled={currentPage === 1}
                      onClick={() => setPage(currentPage - 1)}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    {visiblePages.map((number, index) => (
                      <span key={number} className="technical-page-number">
                        {index > 0 && number - visiblePages[index - 1] > 1 && (
                          <span className="technical-ellipsis">…</span>
                        )}
                        <button
                          aria-label={`Page ${number}`}
                          aria-current={
                            number === currentPage ? "page" : undefined
                          }
                          className={number === currentPage ? "current" : ""}
                          onClick={() => setPage(number)}
                        >
                          {number}
                        </button>
                      </span>
                    ))}
                    <button
                      aria-label="Next page"
                      disabled={currentPage === pageCount}
                      onClick={() => setPage(currentPage + 1)}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              }
            />
          </div>
        </main>
        <aside className="technical-rail">
          <SidePanel title="Quick Actions" className="technical-quick-actions">
            {(
              [
                [CloudUpload, "Upload Document"],
                [PlusSquare, "Request New Document"],
                [ClipboardList, "Document Control Log"],
                [History, "View Change History"],
              ] as const
            ).map(([Icon, label]) => (
              <button key={label} onClick={() => unavailable(label)}>
                <Icon size={17} />
                <span>{label}</span>
                <ChevronRight size={14} />
              </button>
            ))}
          </SidePanel>
          <SidePanel
            title="Document Categories"
            className="technical-categories-panel"
          >
            {documentCategories.map(name => (
              <button
                key={name}
                className={category === name ? "active" : ""}
                onClick={() => selectCategory(category === name ? "" : name)}
              >
                <FolderOpen size={17} />
                <span>{name}</span>
                <strong>{categoryCount(name)}</strong>
              </button>
            ))}
          </SidePanel>
          <SidePanel
            title="Featured Document"
            className="technical-featured-panel"
          >
            <img src={featuredEngine} alt="Aircraft engine" />
            <h4>{featuredTechnicalDocument.title}</h4>
            <p className="technical-featured-meta">
              Engine Manual · {featuredTechnicalDocument.revision} ·{" "}
              {formattedDate(featuredTechnicalDocument.updatedAt)}
            </p>
            <p>
              Maintenance procedures, troubleshooting guidance, and technical
              specifications for this fleet engine.
            </p>
            <button
              onClick={() =>
                unavailable(`View ${featuredTechnicalDocument.title}`)
              }
            >
              View Document <ArrowRight size={14} />
            </button>
          </SidePanel>
          <div className="technical-help-panel">
            <HelpCircle size={22} />
            <div>
              <h3>Need Help?</h3>
              <p>
                Can’t find what you’re looking for? Visit our Knowledge Base for
                more guidance.
              </p>
              <a href="/knowledge-base">
                Go to Knowledge Base <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
