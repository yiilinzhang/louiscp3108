import { Button } from '@blueprintjs/core';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useTokens } from 'src/commons/utils/Hooks';
import { continueChat, initChat } from 'src/features/sicp/chatCompletion/api';
import { SicpSection } from 'src/features/sicp/chatCompletion/chatCompletion';
import { SourceTheme } from 'src/features/sicp/SourceTheme';
import classes from 'src/styles/Chatbot.module.scss';

type Props = {
  getSection: () => SicpSection;
  getText: () => string;
};

const INITIAL_MESSAGE: Readonly<ChatMessage> = {
  content: 'Ask me something about this paragraph!',
  role: 'assistant'
};

const BOT_ERROR_MESSAGE: Readonly<ChatMessage> = {
  content: 'Sorry, I am down with a cold, please try again later.',
  role: 'assistant'
};

const scrollToBottom = (ref: React.RefObject<HTMLDivElement>) => {
  ref.current?.scrollTo({ top: ref.current?.scrollHeight });
};

const ChatBox: React.FC<Props> = ({ getSection, getText }) => {
  const chatRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [userInput, setUserInput] = useState('');
  const [maxContentSize, setMaxContentSize] = useState(1000);
  const tokens = useTokens();

  const handleUserInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(event.target.value);
  };

  // const sendMessage = useCallback(() => {
  //   if (userInput.trim() === '') {
  //     return;
  //   }
  //   setUserInput('');
  //   setMessages(prev => [...prev, { role: 'user', content: userInput }]);
  //   setIsLoading(true);
  //   continueChat(tokens, chatId!, userInput)
  //     .then(resp => {
  //       const message = resp.response;
  //       setMessages(prev => [...prev, { role: 'assistant', content: message }]);
  //     })
  //     .catch(() => {
  //       setMessages(prev => [...prev, BOT_ERROR_MESSAGE]);
  //     })
  //     .finally(() => {
  //       setIsLoading(false);
  //     });
  // }, [chatId, tokens, userInput, maxContentSize]);


// AFTER: sendMessage sends section + text too
const sendMessage = useCallback(() => {
   if (!chatId) {
    console.warn("Chat not initialised yet (chatId missing)");
    return;
  }
  if (userInput.trim() === '') return;
  
  setUserInput('');
  setMessages(prev => [...prev, { role: 'user', content: userInput }]);
  setIsLoading(true);
  
  // Get FRESH section and text at send time!
  const currentSection = getSection();
  const currentText = getText();
  
  continueChat(tokens, chatId!, userInput, currentSection, currentText)
    .then(resp => {
      setMessages(prev => [...prev, { role: 'assistant', content: resp.response }]);
    })
    .catch(() => {
      setMessages(prev => [...prev, BOT_ERROR_MESSAGE]);
    })
    .finally(() => setIsLoading(false));
}, [chatId, tokens, userInput, getSection, getText]);
  const keyDown: React.KeyboardEventHandler<HTMLInputElement> = useCallback(
    e => {
      if (e.key === 'Enter' && !isLoading) {
        sendMessage();
      }
    },
    [isLoading, sendMessage]
  );

  // const resetChat = useCallback(() => {
  //   initChat(tokens, getSection(), getText()).then(resp => {
  //     const message = resp.response;
  //     const conversationId = resp.conversationId;
  //     const maxMessageSize = resp.maxContentSize;
  //     setMessages([message]);
  //     setMaxContentSize(maxMessageSize);
  //     setChatId(conversationId);
  //     setUserInput('');
  //   });
  // }, [getSection, getText, tokens]);

  const resetChat = useCallback(() => {
    initChat(tokens).then(resp => {
      console.log(resp)
      const conversationId = resp.conversationId;
      const maxMessageSize = resp.maxContentSize;
      setMessages([INITIAL_MESSAGE]); // Use local constant
      setMaxContentSize(maxMessageSize);
      console.log(String(conversationId))
      setChatId(String(conversationId));
      setUserInput('');
    });
  }, [tokens]);

  // Run once when component is mounted
  useEffect(() => {
    resetChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollToBottom(chatRef);
  }, [messages, isLoading]);

  return (
    <div className={classes['chat-container']}>
      <div className={classes['chat-message']} ref={chatRef}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={classes[`${message.role}`]}
            style={{ whiteSpace: 'pre-line' }}
          >
            {/* <RenderMessageContent message={message} /> */}
            {renderMessageContent(message)}
          </div>
        ))}
        {isLoading && <p>loading...</p>}
      </div>
      <div className={classes['control-container']}>
        <input
          type="text"
          disabled={isLoading}
          className={classes['user-input']}
          placeholder={isLoading ? 'Waiting for response...' : 'Type your message here...'}
          value={userInput}
          onChange={handleUserInput}
          onKeyDown={keyDown}
          maxLength={maxContentSize}
        />
        <div className={classes['input-count-container']}>
          <div className={classes['input-count']}>{`${userInput.length}/${maxContentSize}`}</div>
        </div>

        <div className={classes['button-container']}>
          <Button disabled={isLoading} className={classes['button-send']} onClick={sendMessage}>
            Send
          </Button>
          <Button className={classes['button-clean']} onClick={resetChat}>
            Clean
          </Button>
        </div>
      </div>
    </div>
  );
};

// const renderMessageContent = (message: ChatMessage, index: number) => {
//   let contentToRender = message.content;
//   if (message.role === 'assistant' && index > 0) {
//     contentToRender += '\n\nThe answer is generated by GPT-4 and may not be correct.';
//   }
//   // TODO: Parse full Markdown, make snippets runnable
//   if (!contentToRender.includes('```javascript')) {
//     return contentToRender;
//   }
//   const renderableRegex = /```javascript\n([\s\S]*?)\n```/g;
//   const chunks = contentToRender.split(renderableRegex);
//   return chunks.map((chunk, i) => {
//     return renderableRegex.test(chunk) ? (
//       <SyntaxHighlighter language="javascript" style={SourceTheme} key={i}>
//         {chunk}
//       </SyntaxHighlighter>
//     ) : (
//       <React.Fragment key={i}>{chunk.trim()}</React.Fragment>
//     );
//   });
// };

const renderMessageContent = (message: ChatMessage) => {
  const content = message.content;

  // Matches code blocks: ```lang ... ```
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index);
      parts.push(
        <div key={lastIndex} style={{ marginBottom: '0.5em' }}>
          {text.split('\n').map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      );
    }

    const lang = match[1] || 'text';
    const code = match[2];
    parts.push(
      <div
        key={match.index}
        className="my-2 rounded-md border border-gray-300 bg-gray-100 p-2 overflow-x-auto"
      >
        <SyntaxHighlighter language={lang} style={SourceTheme} customStyle={{ margin: 0 }}>
          {code}
        </SyntaxHighlighter>
      </div>
    );

    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    const text = content.slice(lastIndex);
    parts.push(
      <div key={lastIndex} style={{ marginBottom: '0.5em' }}>
        {text.split('\n').map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    );
  }

  return <>{parts}</>;
};

export default ChatBox;
