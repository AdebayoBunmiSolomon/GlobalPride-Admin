import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Headset, Lock, NotebookPen, Send, User } from "lucide-react";

import type { TicketMessage, TicketPriority, TicketStatus } from "@/api/types/response";
import { handleApiError } from "@/api/utils";
import { WebAppCard } from "@/components/Card";
import { WebAppDetailList } from "@/components/DetailList";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppSelectInput } from "@/components/Select";
import { useCurrentAdmin } from "@/hooks/useAuth";
import { NoteComposer } from "@/pages/shared/NoteComposer";
import { RelatedLink } from "@/pages/shared/RelatedRecordLink";
import { addTicketNote, replyToTicket, setTicketPriority, setTicketStatus, useTicket } from "@/store/supportStore";
import { appToast } from "@/utils/appToast";
import { cn } from "@/utils/cn";
import { formatDateTimeShort, parseApiDate } from "@/utils/format";
import { ItemLoadState, RefreshButton, TicketPriorityBadge, TicketStatusBadge } from "./SupportParts";
import {
  backToSupport,
  ticketCategoryLabel,
  ticketPriorityOptions,
  ticketPriorityStyles,
  ticketStatusOptions,
  ticketStatusStyles,
} from "./supportOptions";

const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Support", to: "/support" },
  { label: "Ticket Details" },
];

/** The API's limit for a reply or note (from the app's ticket message limit). */
const MESSAGE_MAX_LENGTH = 2000;

const when = (value: string) => (value ? formatDateTimeShort(parseApiDate(value)) : "—");

const RoleChip = ({ children }: { children: string }) => (
  <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">{children}</span>
);

const MessageBubble = ({ message }: { message: TicketMessage }) => {
  const fromAdmin = message.author === "admin";

  return (
    <li className={cn("flex flex-col", fromAdmin ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-xl border px-4 py-3",
          fromAdmin ? "border-primary/15 bg-primary/5" : "border-gray-200 bg-white",
        )}
      >
        <p className="flex items-center gap-2 text-xs font-semibold text-gray-900">
          {message.authorName}
          <RoleChip>{fromAdmin ? "Admin" : "User"}</RoleChip>
        </p>
        <p className="mt-1.5 text-sm whitespace-pre-wrap text-gray-800">{message.body}</p>
      </div>
      <p className="mt-1 text-[11px] text-gray-500">{when(message.createdAt)}</p>
    </li>
  );
};

type Busy = "status" | "priority" | null;

export const TicketDetails = () => {
  const { ticketId = "" } = useParams();
  const { data: ticket, error, loading, refresh } = useTicket(ticketId);
  const { name: adminName } = useCurrentAdmin();
  const [busy, setBusy] = useState<Busy>(null);

  if (!ticket) {
    return (
      <ItemLoadState
        breadcrumbs={breadcrumbs}
        backLink={backToSupport}
        icon={<Headset className="h-6 w-6" />}
        noun="Ticket"
        error={error}
        loading={loading}
        onRetry={refresh}
      />
    );
  }

  // The report's description opens the conversation, unless the API already sends it as the first message.
  const opening: TicketMessage | null =
    ticket.description && ticket.messages[0]?.body !== ticket.description
      ? {
          id: "description",
          author: "user",
          authorName: ticket.userName,
          body: ticket.description,
          createdAt: ticket.createdAt,
        }
      : null;
  const conversation = opening ? [opening, ...ticket.messages] : ticket.messages;

  const changeStatus = async (status: TicketStatus) => {
    if (status === ticket.status) return;
    setBusy("status");
    try {
      const { message } = await setTicketStatus(ticket, status);
      appToast.show("Status updated", message || `${ticket.reference} is now ${ticketStatusStyles[status].label}.`, "success");
    } catch (caught) {
      handleApiError(caught, { fallbackMessage: "We couldn't change the ticket status." });
    } finally {
      setBusy(null);
    }
  };

  const changePriority = async (priority: TicketPriority) => {
    if (priority === ticket.priority) return;
    setBusy("priority");
    try {
      const { message } = await setTicketPriority(ticket, priority);
      appToast.show(
        "Priority updated",
        message || `${ticket.reference} is now ${ticketPriorityStyles[priority].label} priority.`,
        "success",
      );
    } catch (caught) {
      handleApiError(caught, { fallbackMessage: "We couldn't change the ticket priority." });
    } finally {
      setBusy(null);
    }
  };

  /** Resolves to whether it was sent, so the composer keeps the text on failure. */
  const send = async (action: typeof replyToTicket, body: string, done: string, fallbackMessage: string) => {
    try {
      const { message } = await action(ticket, body, adminName);
      appToast.show("Sent", message || done, "success");
      return true;
    } catch (caught) {
      handleApiError(caught, { fallbackMessage });
      return false;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <WebAppPageHeader
          breadcrumbs={breadcrumbs}
          backLink={backToSupport}
          actions={<RefreshButton label="Refresh ticket" loading={loading} onClick={() => void refresh()} />}
        />
        <div className="-mt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-bold text-gray-900">{ticket.reference}</span>
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
          </div>
          <h1 className="mt-1 text-3xl leading-tight font-bold text-gray-900">{ticket.subject}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Submitted by{" "}
            {ticket.userId ? (
              <Link to={`/users/${encodeURIComponent(ticket.userId)}`} className="font-medium text-primary hover:underline">
                {ticket.userName}
              </Link>
            ) : (
              <span className="font-medium text-gray-900">{ticket.userName}</span>
            )}
            {ticket.userEmail && ticket.userEmail !== ticket.userName && ` · ${ticket.userEmail}`}
          </p>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <WebAppCard
          title="Conversation"
          description="Messages between the user and the support team."
          divided
          bodyClassName="p-0"
          className="overflow-hidden"
        >
          {conversation.length > 0 ? (
            <ul className="space-y-4 border-b border-gray-200 p-5">
              {conversation.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </ul>
          ) : (
            <p className="border-b border-gray-200 p-5 text-sm text-gray-500">No messages yet.</p>
          )}

          <div className="border-b border-gray-200 p-5">
            <p className="mb-2 text-sm font-medium text-gray-900">Reply to user</p>
            <NoteComposer
              id="ticketReply"
              label="Reply to user"
              placeholder="Type your response to the user…"
              hint="sent to the user in the app, with a notification · moves the ticket to Pending User"
              submitLabel="Send Reply"
              submitIcon={Send}
              variant="primary"
              maxLength={MESSAGE_MAX_LENGTH}
              onSubmit={(body) => send(replyToTicket, body, "Your reply was sent to the user.", "We couldn't send this reply.")}
            />
          </div>

          <div className="bg-stone-50 p-5">
            <p className="mb-3 flex flex-wrap items-center gap-2">
              <Lock className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-900">Internal Notes</span>
              <span className="text-xs text-gray-500">Never visible to the user</span>
            </p>
            {ticket.notes.length > 0 && (
              <ul className="mb-3 space-y-3">
                {ticket.notes.map((note) => (
                  <li key={note.id} className="rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-amber-800">
                      <Lock className="h-3.5 w-3.5" />
                      Internal note · not visible to the user
                    </p>
                    <p className="mt-1 text-sm whitespace-pre-wrap text-gray-900">{note.body}</p>
                    <p className="mt-1 text-[11px] text-gray-500">
                      {note.authorName} · {when(note.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <NoteComposer
              id="ticketNote"
              label="Internal note"
              placeholder="Add an internal note for the support team…"
              submitLabel="Add Note"
              submitIcon={NotebookPen}
              variant="outline"
              maxLength={MESSAGE_MAX_LENGTH}
              onSubmit={(body) => send(addTicketNote, body, "Your internal note was added.", "We couldn't add this note.")}
            />
          </div>
        </WebAppCard>

        <div className="space-y-4">
          <WebAppCard title="Ticket Information">
            <WebAppDetailList
              align="right"
              className="-my-3"
              items={[
                { label: "Reference", value: ticket.reference },
                { label: "Category", value: ticketCategoryLabel(ticket.category) },
                { label: "Created", value: when(ticket.createdAt) },
                { label: "Last Updated", value: when(ticket.updatedAt) },
              ]}
            />
          </WebAppCard>

          <WebAppCard title="Manage Ticket">
            <div className="space-y-4">
              <WebAppSelectInput
                id="ticketStatusSelect"
                label="Status"
                labelClassName="text-xs"
                options={ticketStatusOptions}
                value={ticket.status}
                disabled={busy !== null}
                onChange={(value) => void changeStatus(value as TicketStatus)}
              />
              <WebAppSelectInput
                id="ticketPrioritySelect"
                label="Priority"
                labelClassName="text-xs"
                options={ticketPriorityOptions}
                value={ticket.priority}
                disabled={busy !== null}
                onChange={(value) => void changePriority(value as TicketPriority)}
              />
              <p className="text-xs text-gray-500">
                {busy
                  ? `Saving ${busy}…`
                  : "Workflow: Open → In Progress → Pending User → Resolved → Closed. Replying moves a ticket to Pending User."}
              </p>
            </div>
          </WebAppCard>

          {(ticket.userId || ticket.userEmail) && (
            <WebAppCard title="Related Information" description="Open the related record to investigate further.">
              {ticket.userId ? (
                <RelatedLink
                  icon={User}
                  label="User"
                  title={ticket.userName}
                  subtitle={ticket.userEmail ?? undefined}
                  to={`/users/${encodeURIComponent(ticket.userId)}`}
                />
              ) : (
                <p className="text-sm text-gray-600">{ticket.userEmail}</p>
              )}
            </WebAppCard>
          )}
        </div>
      </div>
    </div>
  );
};
