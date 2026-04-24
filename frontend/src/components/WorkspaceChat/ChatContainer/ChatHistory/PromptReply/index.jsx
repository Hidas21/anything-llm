/* eslint-disable react-hooks/refs */
import { memo, useRef, useEffect } from "react";
import { Warning } from "@phosphor-icons/react";
import renderMarkdown from "@/utils/chat/markdown";
import DOMPurify from "@/utils/chat/purify";
import Citations from "../Citation";
import {
  THOUGHT_REGEX_CLOSE,
  THOUGHT_REGEX_COMPLETE,
  THOUGHT_REGEX_OPEN,
  ThoughtChainComponent,
} from "../ThoughtContainer";

const PromptReply = ({ uuid, reply, pending, error, sources = [] }) => {
  if (!reply && sources.length === 0 && !pending && !error) return null;

  if (pending) {
    return (
      <div className="flex justify-start w-full">
        <div className="py-4 pl-0 pr-4 flex flex-col md:max-w-[80%]">
          <div className="mt-3 ml-1 dot-falling light:invert"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-start w-full">
        <div className="py-4 pl-0 pr-4 flex flex-col md:max-w-[80%]">
          <span className="inline-block p-2 rounded-lg bg-red-50 text-red-500">
            <Warning className="h-4 w-4 mb-1 inline-block" /> Could not respond
            to message.
            <span className="text-xs">Reason: {error || "unknown"}</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div key={uuid} className="flex justify-start w-full">
      <div className="py-4 pl-0 pr-4 flex flex-col w-full">
        <RenderAssistantChatContent
          key={`${uuid}-prompt-reply-content`}
          message={reply}
          messageId={uuid}
        />
        <Citations sources={sources} />
      </div>
    </div>
  );
};

function RenderAssistantChatContent({ message, messageId }) {
  const spanRef = useRef(null);
  const thoughtChainRef = useRef(null);

  const thinking =
    message.match(THOUGHT_REGEX_OPEN) && !message.match(THOUGHT_REGEX_CLOSE);
  const completeThoughtChain = message.match(THOUGHT_REGEX_COMPLETE)?.[0];
  const msgToRender = thinking
    ? ""
    : message.replace(THOUGHT_REGEX_COMPLETE, "");

  useEffect(() => {
    if (thinking && thoughtChainRef.current) {
      thoughtChainRef.current.updateContent(message);
      return;
    }
    if (completeThoughtChain && thoughtChainRef.current) {
      thoughtChainRef.current.updateContent(completeThoughtChain);
    }
    if (spanRef.current) {
      spanRef.current.innerHTML = DOMPurify.sanitize(
        renderMarkdown(msgToRender)
      );
    }
  }, [message]);

  if (thinking)
    return (
      <ThoughtChainComponent
        ref={thoughtChainRef}
        content=""
        messageId={messageId}
      />
    );

  return (
    <div className="flex flex-col gap-y-1">
      {completeThoughtChain && (
        <ThoughtChainComponent
          ref={thoughtChainRef}
          content=""
          messageId={messageId}
        />
      )}
      <span
        ref={spanRef}
        className="break-words"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(renderMarkdown(msgToRender)),
        }}
      />
    </div>
  );
}

export default memo(PromptReply);
