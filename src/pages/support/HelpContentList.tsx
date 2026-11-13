import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Globe, Newspaper, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { WebAppActionMenu } from "@/components/ActionMenu";
import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { useSupport } from "@/hooks/useSupport";
import type { HelpContent, HelpContentKind } from "@/types/support";
import { formatDate } from "@/utils/format";
import { DeleteHelpContentModal, HelpContentPreviewModal, HelpStatusBadge, SupportTabs } from "./SupportParts";
import {
  backToSupport,
  helpCategoryFilterOptions,
  helpCategoryLabels,
  helpContentKinds,
  helpStatusFilterOptions,
} from "./supportOptions";

const PAGE_SIZE = 10;

const HelpContentList = ({ kind }: { kind: HelpContentKind }) => {
  const config = helpContentKinds[kind];
  const navigate = useNavigate();
  const items = useSupport((state) => state.content[kind]);
  const { setContentStatus, deleteContent } = useSupport();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [previewing, setPreviewing] = useState<HelpContent>();
  const [deleting, setDeleting] = useState<HelpContent>();

  // TODO: move search / filters / paging to the API once the content endpoints exist.
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items
      .filter(
        (item) =>
          (category === "all" || item.category === category) &&
          (status === "all" || item.status === status) &&
          (!query || item.title.toLowerCase().includes(query) || item.id.toLowerCase().includes(query)),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
  }, [items, search, category, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const withPageReset = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  // TODO: call the content API once the publish / delete endpoints exist.
  const handleDelete = (item: HelpContent) => {
    deleteContent(kind, item.id);
    setDeleting(undefined);
  };

  return (
    <div className="space-y-6">
      <div>
        <WebAppPageHeader
          title={config.listTitle}
          description={config.listDescription}
          breadcrumbs={[
            { label: "Dashboard", to: "/dashboard" },
            { label: "Support", to: "/support" },
            { label: config.listTitle },
          ]}
          backLink={backToSupport}
          actions={
            <WebAppButton leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate(`${config.path}/new`)}>
              {config.createLabel}
            </WebAppButton>
          }
        />
        <div className="-mt-2">
          <SupportTabs />
        </div>
      </div>

      <WebAppCard bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-5 py-4">
          <WebAppInput
            id={`${kind}Search`}
            type="search"
            placeholder={config.searchPlaceholder}
            aria-label={config.searchPlaceholder}
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(event) => withPageReset(setSearch)(event.target.value)}
            fullWidth={false}
            containerClassName="w-full sm:w-72"
          />
          <WebAppSelectInput
            id={`${kind}Category`}
            options={helpCategoryFilterOptions}
            value={category}
            onChange={withPageReset(setCategory)}
            fullWidth={false}
            containerClassName="w-full sm:w-44"
          />
          <WebAppSelectInput
            id={`${kind}Status`}
            options={helpStatusFilterOptions}
            value={status}
            onChange={withPageReset(setStatus)}
            fullWidth={false}
            containerClassName="w-full sm:w-40"
          />
        </div>

        {pageItems.length === 0 ? (
          <WebAppEmptyState
            icon={<Newspaper className="h-6 w-6" />}
            title={config.emptyTitle}
            description="Try a different search term or filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left text-sm">
              <thead className="border-b border-gray-200 text-xs text-gray-600">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">{config.column}</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Category</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Last Updated</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageItems.map((item) => {
                  const isPublished = item.status === "published";
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/60">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.id}</p>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">{helpCategoryLabels[item.category]}</td>
                      <td className="px-5 py-3.5">
                        <HelpStatusBadge status={item.status} />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-700">{formatDate(item.updatedAt)}</td>
                      <td className="px-5 py-3.5">
                        <WebAppActionMenu
                          label={`Actions for ${item.id}`}
                          className="ml-3"
                          items={[
                            { label: "Edit", icon: Pencil, onSelect: () => navigate(`${config.path}/${item.id}/edit`) },
                            { label: "Preview", icon: Eye, onSelect: () => setPreviewing(item) },
                            isPublished
                              ? {
                                  label: "Unpublish",
                                  icon: EyeOff,
                                  onSelect: () => setContentStatus(kind, item.id, "unpublished"),
                                }
                              : { label: "Publish", icon: Globe, onSelect: () => setContentStatus(kind, item.id, "published") },
                            { label: "Delete", icon: Trash2, danger: true, onSelect: () => setDeleting(item) },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <WebAppPagination
            className="border-t border-gray-200 px-5 py-4"
            page={currentPage}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={setPage}
            itemLabel={config.itemLabel}
          />
        )}
      </WebAppCard>

      <HelpContentPreviewModal kind={kind} content={previewing} onClose={() => setPreviewing(undefined)} />
      <DeleteHelpContentModal
        kind={kind}
        content={deleting}
        onClose={() => setDeleting(undefined)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export const HelpArticles = () => <HelpContentList key="article" kind="article" />;

export const Faqs = () => <HelpContentList key="faq" kind="faq" />;
