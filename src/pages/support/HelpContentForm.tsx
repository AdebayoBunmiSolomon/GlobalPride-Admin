import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Eye, Newspaper, Save } from "lucide-react";

import { WebAppButton } from "@/components/Button";
import { WebAppCard } from "@/components/Card";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppInput } from "@/components/Input";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppRichTextEditor } from "@/components/RichTextEditor";
import { WebAppSelectInput } from "@/components/Select";
import { useSupport } from "@/hooks/useSupport";
import { fieldError } from "@/pages/pricing/fieldError";
import { makeHelpContentSchema, type HelpContentValues } from "@/schemas/support";
import type { HelpContent, HelpContentKind, HelpContentStatus } from "@/types/support";
import { cn } from "@/utils/cn";
import { sanitizeRichText } from "@/utils/richText";
import { HelpContentPreviewModal } from "./SupportParts";
import { helpCategoryOptions, helpContentKinds, helpStatusStyles } from "./supportOptions";

const statuses: HelpContentStatus[] = ["published", "unpublished"];

const StatusToggle = ({
  labelId,
  value,
  onChange,
}: {
  labelId: string;
  value: HelpContentStatus;
  onChange: (value: HelpContentStatus) => void;
}) => (
  <div
    role="radiogroup"
    aria-labelledby={labelId}
    className="grid h-11 grid-cols-2 gap-1 rounded-lg border border-gray-200 bg-stone-50 p-1"
  >
    {statuses.map((status) => (
      <button
        key={status}
        type="button"
        role="radio"
        aria-checked={value === status}
        onClick={() => onChange(status)}
        className={cn(
          "rounded-md text-sm font-medium transition-colors",
          value === status ? "bg-white text-primary shadow-sm" : "text-gray-700 hover:text-gray-900",
        )}
      >
        {helpStatusStyles[status].label}
      </button>
    ))}
  </div>
);

const Required = () => (
  <span className="ml-1 text-red-500" aria-hidden="true">
    *
  </span>
);

interface HelpContentFormProps {
  kind: HelpContentKind;
  /** Omit to create a new article / FAQ. */
  content?: HelpContent;
}

const HelpContentForm = ({ kind, content }: HelpContentFormProps) => {
  const config = helpContentKinds[kind];
  const navigate = useNavigate();
  const { createContent, updateContent } = useSupport();
  const [preview, setPreview] = useState<Pick<HelpContent, "title" | "category" | "body">>();
  const schema = useMemo(
    () => makeHelpContentSchema({ titleRequired: config.titleRequired, bodyRequired: config.bodyRequired }),
    [config],
  );

  const {
    register,
    control,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<HelpContentValues>({
    resolver: yupResolver(schema),
    defaultValues: content
      ? { title: content.title, category: content.category, status: content.status, body: content.body }
      : { title: "", status: "unpublished", body: "" },
  });

  // TODO: send to the API once the content endpoints are available.
  const onSubmit = (values: HelpContentValues) => {
    const input = { ...values, body: sanitizeRichText(values.body) };
    if (content) updateContent(kind, content.id, input);
    else createContent(kind, input);
    navigate(config.path);
  };

  const openPreview = () => {
    const { title, category, body } = getValues();
    setPreview({ title: title ?? "", category, body: body ?? "" });
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <WebAppCard title={config.detailsTitle}>
        <div className="space-y-4">
          <WebAppInput
            id={`${kind}Title`}
            label={config.titleLabel}
            required
            placeholder={config.titlePlaceholder}
            autoFocus={!content}
            error={fieldError(errors.title?.message)}
            {...register("title")}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <WebAppSelectInput
                  id={`${kind}Category`}
                  label="Category"
                  required
                  placeholder="Select a category"
                  options={helpCategoryOptions}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  error={fieldError(errors.category?.message)}
                />
              )}
            />
            <div>
              <p id={`${kind}StatusLabel`} className="mb-1.5 text-sm font-medium text-gray-700">
                Status
              </p>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <StatusToggle labelId={`${kind}StatusLabel`} value={field.value} onChange={field.onChange} />
                )}
              />
            </div>
          </div>

          <p className="rounded-lg bg-stone-50 px-3 py-2 text-xs text-gray-600">{config.statusNote}</p>
        </div>
      </WebAppCard>

      <WebAppCard
        title={
          <span id={`${kind}BodyLabel`}>
            {config.bodyLabel}
            <Required />
          </span>
        }
        description={config.bodyDescription}
      >
        <Controller
          control={control}
          name="body"
          render={({ field }) => (
            <WebAppRichTextEditor
              id={`${kind}Body`}
              labelledBy={`${kind}BodyLabel`}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder={config.bodyPlaceholder}
              error={fieldError(errors.body?.message)}
            />
          )}
        />
      </WebAppCard>

      <div className="flex flex-wrap justify-end gap-3">
        <WebAppButton variant="outline" leftIcon={<Eye className="h-4 w-4" />} onClick={openPreview}>
          Preview
        </WebAppButton>
        <WebAppButton variant="outline" onClick={() => navigate(config.path)}>
          Cancel
        </WebAppButton>
        <WebAppButton type="submit" loading={isSubmitting} leftIcon={<Save className="h-4 w-4" />}>
          {config.saveLabel}
        </WebAppButton>
      </div>

      <HelpContentPreviewModal kind={kind} content={preview} onClose={() => setPreview(undefined)} />
    </form>
  );
};

const breadcrumbsFor = (kind: HelpContentKind, last: string) => [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Support", to: "/support" },
  { label: helpContentKinds[kind].listTitle, to: helpContentKinds[kind].path },
  { label: last },
];

const CreateHelpContent = ({ kind }: { kind: HelpContentKind }) => {
  const config = helpContentKinds[kind];
  return (
    <div>
      <WebAppPageHeader
        title={config.createTitle}
        description={config.createDescription}
        breadcrumbs={breadcrumbsFor(kind, config.createCrumb)}
        backLink={{ label: config.backLabel, to: config.path }}
      />
      <HelpContentForm kind={kind} />
    </div>
  );
};

const EditHelpContent = ({ kind }: { kind: HelpContentKind }) => {
  const config = helpContentKinds[kind];
  const { contentId } = useParams();
  const navigate = useNavigate();
  const content = useSupport((state) => state.content[kind].find((item) => item.id === contentId));
  const backLink = { label: config.backLabel, to: config.path };

  if (!content) {
    return (
      <div>
        <WebAppPageHeader breadcrumbs={breadcrumbsFor(kind, config.editCrumb)} backLink={backLink} />
        <WebAppCard>
          <WebAppEmptyState
            icon={<Newspaper className="h-6 w-6" />}
            title={config.notFoundTitle}
            description="It may have been deleted, or the link is incorrect."
            primaryAction={{ label: config.backLabel, onClick: () => navigate(config.path) }}
          />
        </WebAppCard>
      </div>
    );
  }

  return (
    <div>
      <WebAppPageHeader
        title={config.editTitle}
        description={config.editDescription}
        breadcrumbs={breadcrumbsFor(kind, config.editCrumb)}
        backLink={backLink}
      />
      {/* Keyed so switching between items starts a fresh form. */}
      <HelpContentForm key={content.id} kind={kind} content={content} />
    </div>
  );
};

export const CreateHelpArticle = () => <CreateHelpContent key="article" kind="article" />;
export const EditHelpArticle = () => <EditHelpContent key="article" kind="article" />;
export const CreateFaq = () => <CreateHelpContent key="faq" kind="faq" />;
export const EditFaq = () => <EditHelpContent key="faq" kind="faq" />;
