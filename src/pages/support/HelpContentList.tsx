import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircleAlert, Eye, EyeOff, Globe, Newspaper, Pencil, Plus, Search, Trash2 } from "lucide-react";

import type { AdminHelpContent, HelpContentKind } from "@/api/types/response";
import { handleApiError } from "@/api/utils";
import { WebAppActionMenu } from "@/components/ActionMenu";
import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppPagination } from "@/components/Pagination";
import { WebAppSelectInput } from "@/components/Select";
import { useListParams } from "@/hooks/useListParams";
import { deleteHelpContent, setHelpContentPublished, useHelpContent, useHelpContentList } from "@/store/supportStore";
import { appToast } from "@/utils/appToast";
import { formatDate, parseApiDate } from "@/utils/format";
import {
  DeleteHelpContentModal,
  HelpContentPreviewModal,
  HelpStatusBadge,
  ListLoadState,
  RefreshButton,
  SupportTabs,
} from "./SupportParts";
import {
  backToSupport,
  helpCategoryFilterOptions,
  helpCategoryLabel,
  helpContentKinds,
  helpStatusFilterOptions,
} from "./supportOptions";

const PAGE_SIZE = 10;

/** Preview of a list row: the row may not include the body, so the item is loaded for it. */
const PreviewFromList = ({
  kind,
  item,
  onClose,
}: {
  kind: HelpContentKind;
  item: AdminHelpContent;
  onClose: () => void;
}) => {
  const { data, error, loading } = useHelpContent(kind, item.id);
  return (
    <HelpContentPreviewModal
      kind={kind}
      content={{ ...item, body: data?.body ?? item.body }}
      loading={loading}
      error={error ? `Couldn't load the content: ${error.message}` : null}
      onClose={onClose}
    />
  );
};

const HelpContentList = ({ kind }: { kind: HelpContentKind }) => {
  const config = helpContentKinds[kind];
  const navigate = useNavigate();
  // Filters live in the URL so "Back to …" from the edit page returns to the same view.
  const { get, update, page: requestedPage } = useListParams({ category: "all", status: "all", page: "1" });
  const search = get("q");
  const category = get("category");
  const status = get("status");

  // Every item is fetched once and cached (see src/store); filtering runs in the browser.
  const { data: items, error, loading, refresh } = useHelpContentList(kind);
  const [previewing, setPreviewing] = useState<AdminHelpContent>();
  const [deleting, setDeleting] = useState<AdminHelpContent>();
  const [busyId, setBusyId] = useState<string | null>(null);

  const categoryOptions = useMemo(
    () => helpCategoryFilterOptions((items ?? []).map((item) => item.category)),
    [items],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return (items ?? [])
      .filter(
        (item) =>
          (category === "all" || item.category.toLowerCase() === category.toLowerCase()) &&
          (status === "all" || item.status === status) &&
          (!query || [item.title, item.summary].some((value) => value.toLowerCase().includes(query))),
      )
      .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "") || a.title.localeCompare(b.title));
  }, [items, search, category, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const noun = kind === "article" ? "Article" : "FAQ";

  const togglePublished = async (item: AdminHelpContent) => {
    if (busyId) return;
    const publish = item.status !== "published";
    setBusyId(item.id);
    try {
      const { message } = await setHelpContentPublished(kind, item, publish);
      appToast.show(
        publish ? `${noun} published` : `${noun} unpublished`,
        message || (publish ? "It's now visible in the Global Pride app." : "It's now hidden from app users."),
        "success",
      );
    } catch (caught) {
      handleApiError(caught, { fallbackMessage: `We couldn't ${publish ? "publish" : "unpublish"} this ${noun.toLowerCase()}.` });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (item: AdminHelpContent) => {
    setBusyId(item.id);
    try {
      const { message } = await deleteHelpContent(kind, item);
      appToast.show(`${noun} deleted`, message || `"${item.title}" was deleted.`, "success");
      setDeleting(undefined);
    } catch (caught) {
      handleApiError(caught, { fallbackMessage: `We couldn't delete this ${noun.toLowerCase()}.` });
    } finally {
      setBusyId(null);
    }
  };

  const total = items?.length ?? 0;
  const description = !items
    ? undefined
    : filtered.length === total
      ? `${total.toLocaleString()} ${config.itemLabel}`
      : `${filtered.length.toLocaleString()} of ${total.toLocaleString()} ${config.itemLabel}`;

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
            <>
              <RefreshButton label={`Refresh ${config.itemLabel}`} loading={loading} onClick={() => void refresh()} />
              <WebAppButton leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate(`${config.path}/new`)}>
                {config.createLabel}
              </WebAppButton>
            </>
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
            onChange={(event) => update({ q: event.target.value, page: null })}
            fullWidth={false}
            containerClassName="w-full sm:w-72"
          />
          <WebAppSelectInput
            id={`${kind}Category`}
            options={categoryOptions}
            value={category}
            onChange={(value) => update({ category: value, page: null })}
            fullWidth={false}
            containerClassName="w-full sm:w-44"
          />
          <WebAppSelectInput
            id={`${kind}Status`}
            options={helpStatusFilterOptions}
            value={status}
            onChange={(value) => update({ status: value, page: null })}
            fullWidth={false}
            containerClassName="w-full sm:w-40"
          />
          {description && <p className="text-sm text-gray-500 sm:ml-auto">{description}</p>}
        </div>

        {error && items && (
          <p role="alert" className="flex items-center gap-2 border-b border-gray-200 px-5 py-3 text-sm text-red-600">
            <CircleAlert className="h-4 w-4" />
            Couldn't refresh {config.itemLabel}: {error.message}
          </p>
        )}

        {!items ? (
          <ListLoadState error={error} hasData={false} what={config.itemLabel} onRetry={() => void refresh()} />
        ) : pageItems.length === 0 ? (
          <WebAppEmptyState
            icon={<Newspaper className="h-6 w-6" />}
            title={total === 0 ? config.noneYetTitle : config.emptyTitle}
            description={total === 0 ? config.noneYetText : "Try a different search term or filter."}
            primaryAction={
              total === 0 ? { label: config.createLabel, onClick: () => navigate(`${config.path}/new`) } : undefined
            }
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
                  const busy = busyId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/60">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">{item.title}</p>
                        {item.summary && <p className="line-clamp-1 text-xs text-gray-500">{item.summary}</p>}
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">{helpCategoryLabel(item.category)}</td>
                      <td className="px-5 py-3.5">
                        <HelpStatusBadge status={item.status} />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-gray-700">
                        {item.updatedAt ? formatDate(parseApiDate(item.updatedAt)) : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <WebAppActionMenu
                          label={`Actions for ${item.title}`}
                          className="ml-3"
                          items={[
                            {
                              label: "Edit",
                              icon: Pencil,
                              onSelect: () => navigate(`${config.path}/${encodeURIComponent(item.id)}/edit`),
                            },
                            { label: "Preview", icon: Eye, onSelect: () => setPreviewing(item) },
                            {
                              label: busy ? "Saving…" : isPublished ? "Unpublish" : "Publish",
                              icon: isPublished ? EyeOff : Globe,
                              onSelect: () => void togglePublished(item),
                            },
                            { label: "Delete", icon: Trash2, danger: true, onSelect: () => !busy && setDeleting(item) },
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
            page={page}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            onPageChange={(next) => update({ page: next })}
            itemLabel={config.itemLabel}
          />
        )}
      </WebAppCard>

      {previewing && <PreviewFromList kind={kind} item={previewing} onClose={() => setPreviewing(undefined)} />}
      <DeleteHelpContentModal
        kind={kind}
        content={deleting}
        busy={Boolean(deleting && busyId === deleting.id)}
        onClose={() => setDeleting(undefined)}
        onConfirm={(item) => void handleDelete(item)}
      />
    </div>
  );
};

export const HelpArticles = () => <HelpContentList key="article" kind="article" />;

export const Faqs = () => <HelpContentList key="faq" kind="faq" />;
