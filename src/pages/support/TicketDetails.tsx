import { Link, useNavigate, useParams } from "react-router-dom";
import { Headset, Lock, NotebookPen, Send, User } from "lucide-react";

import { WebAppCard } from "@/components/Card";
import { WebAppDetailList } from "@/components/DetailList";
import { WebAppEmptyState } from "@/components/EmptyState";
import { WebAppPageHeader } from "@/components/PageHeader";
import { WebAppSelectInput } from "@/components/Select";
import { useSupport } from "@/hooks/useSupport";
import { NoteComposer } from "@/pages/shared/NoteComposer";
import { RelatedLink, RelatedRecordLink } from "@/pages/shared/RelatedRecordLink";
import type { TicketMessage, TicketPriority, TicketStatus } from "@/types/support";
import { cn } from "@/utils/cn";
import { formatDateTimeShort } from "@/utils/format";
import { TicketPriorityBadge, TicketStatusBadge } from "./SupportParts";
import {
  backToSupport,
  ticketCategoryLabels,
  ticketPriorityOptions,
  ticketStatusOptions,
} from "./supportOptions";

const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Support", to: "/support" },
  { label: "Ticket Details" },
];

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
      <p className="mt-1 text-[11px] text-gray-500">{formatDateTimeShort(message.createdAt)}</p>
    </li>
  );
};

export const TicketDetails = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const ticket = useSupport((state) => state.tickets.find((item) => item.id === ticketId));
  const { setTicketStatus, setTicketPriority, addTicketReply, addTicketNote } = useSupport();

  if (!ticket) {
    return (
      <div>
        <WebAppPageHeader breadcrumbs={breadcrumbs} backLink={backToSupport} />
        <WebAppCard>
          <WebAppEmptyState
            icon={<Headset className="h-6 w-6" />}
            title="Ticket not found"
            description="This support ticket doesn't exist, or the link is incorrect."
            primaryAction={{ label: "Back to Support", onClick: () => navigate("/support") }}
          />
        </WebAppCard>
      </div>
    );
  }

  // TODO: call the support API once the reply / note / update endpoints exist.
  return (
    <div className="space-y-4">
      <div>
        <WebAppPageHeader breadcrumbs={breadcrumbs} backLink={backToSupport} />
        <div className="-mt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-bold text-gray-900">{ticket.id}</span>
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
          </div>
          <h1 className="mt-1 text-3xl leading-tight font-bold text-gray-900">{ticket.subject}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Submitted by{" "}
            <Link to={`/users/${ticket.userId}`} className="font-medium text-primary hover:underline">
              {ticket.userName}
            </Link>{" "}
            · {ticket.userId}
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
          <ul className="space-y-4 border-b border-gray-200 p-5">
            {ticket.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </ul>

          <div className="border-b border-gray-200 p-5">
            <p className="mb-2 text-sm font-medium text-gray-900">Reply to user</p>
            <NoteComposer
              id="ticketReply"
              label="Reply to user"
              placeholder="Type your response to the user…"
              hint="sent to the user"
              submitLabel="Send Reply"
              submitIcon={Send}
              variant="primary"
              onSubmit={(body) => addTicketReply(ticket.id, body)}
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
                      {note.authorName} · {formatDateTimeShort(note.createdAt)}
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
              onSubmit={(body) => addTicketNote(ticket.id, body)}
            />
          </div>
        </WebAppCard>

        <div className="space-y-4">
          <WebAppCard title="Ticket Information">
            <WebAppDetailList
              align="right"
              className="-my-3"
              items={[
                { label: "Ticket ID", value: ticket.id },
                { label: "Category", value: ticketCategoryLabels[ticket.category] },
                { label: "Created", value: formatDateTimeShort(ticket.createdAt) },
                { label: "Last Updated", value: formatDateTimeShort(ticket.updatedAt) },
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
                onChange={(value) => setTicketStatus(ticket.id, value as TicketStatus)}
              />
              <WebAppSelectInput
                id="ticketPrioritySelect"
                label="Priority"
                labelClassName="text-xs"
                options={ticketPriorityOptions}
                value={ticket.priority}
                onChange={(value) => setTicketPriority(ticket.id, value as TicketPriority)}
              />
              <p className="text-xs text-gray-500">
                Workflow: Open → In Progress → Pending User → Resolved → Closed.
              </p>
            </div>
          </WebAppCard>

          <WebAppCard title="Related Information" description="Open the related record to investigate further.">
            <div className="space-y-3">
              <RelatedLink icon={User} label="User" title={ticket.userName} subtitle={ticket.userId} to={`/users/${ticket.userId}`} />
              {ticket.related && <RelatedRecordLink record={ticket.related} />}
            </div>
          </WebAppCard>
        </div>
      </div>
    </div>
  );
};
