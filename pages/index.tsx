import Head from "next/head";
import Image from "next/image";
import ip from "ip";
import { useSocket } from "@/hooks/useSocket";
import { useDeviceId } from "@/hooks/useDeviceId";
import { useMemoizedFn, useMount, useUpdate, useUpdateEffect } from "ahooks";
import { useEffect, useRef, useState } from "react";
import { FileContent, useFilePicker } from "use-file-picker";
import { QRCodeCanvas } from "qrcode.react";
import ReactDOM from "react-dom";
import clsx from "clsx";
import { Copy } from "@/components/Copy";
import { formatTime } from "@/utils/utils";
interface IFileContent extends FileContent {
  timestamp: number;
  deviceId: string;
  type: "file" | "text";
}
interface IStaticProps {
  localIp: string;
  port: number;
}

function wrapperFileContent(
  fileContent: Partial<IFileContent>,
  args: Record<string, any> = {}
) {
  return {
    ...fileContent,
    timestamp: Date.now(),
    ...args,
  };
}

export async function getStaticProps() {
  // get build service ip
  const localIp = ip.address() || "localhost";
  return {
    props: {
      localIp,
      port: process.env.PORT || 3000,
    },
  };
}


interface IChatBoardItemProps {
  item: Omit<IFileContent, "content">;
  deviceId: string | null;
  onDownload?: (item: Omit<IFileContent, "content">) => void;
}
function ChatBoardItem(props: IChatBoardItemProps) {
  const [copyVisible, setCopyVisible] = useState(false);
  return (
    <div className="mx-2 my-3 relative">
      <div className="my-1">
       <span className="font-semibold"> {props.item.deviceId}</span>
        <span className="ml-2 opacity-60">{formatTime(props.item.timestamp)}</span>
      </div>
      <div
        onMouseEnter={() => {
          setCopyVisible(true);
        }}
        onMouseLeave={() => {
          setCopyVisible(false);
        }}
        className={clsx(
          " rounded p-2 hover:opacity-90 whitespace-pre-wrap",
          props.deviceId === props.item.deviceId
            ? "bg-[#3fb475] text-[#333]"
            : "bg-[#2c2c2c]"
        )}
      >
        {props.item.name}
        {/* {item.content && (
          <img
            src={URL.createObjectURL(
              new Blob([item.content as unknown as ArrayBuffer])
            )}
          />
        )} */}
        <Copy
          visible={copyVisible && props.item.type === "text"}
          text={props.item.name}
        ></Copy>
        {copyVisible && props.item.type === "file" && (
          <button
            onClick={() => {
              const item = props.item;
              if (item.type === "file") {
                props.onDownload?.(props.item);
              }
            }}
            className="bg-gray-300 px-2 right-0 absolute h-6 bottom-0 rounded text-gray-700 "
          >
            download
          </button>
        )}
      </div>
    </div>
  );
}

export default function Home({ localIp, port }: IStaticProps) {
  const { deviceId } = useDeviceId();
  const socket = useSocket(deviceId, localIp, port);
  const [onlineClients, setOnlineClients] = useState<string[]>([]);
  const chatDomRef = useRef<HTMLDivElement>(null);
  const [chatBoardNoContent, setChatBoardNoContent] = useState<
    Omit<IFileContent, "content">[]
  >([]);

  const [dialogVisible, setDialogVisible] = useState(false);
  // const temptFile = useRef<IFileContent | null>()
  useUpdateEffect(() => {
    socket?.on("online-clients", (data) => {
      console.log("online-clients:", data);
      setOnlineClients(data.onlineClients);
    });

    socket?.on("update-chat-board", (data) => {
      console.log("update-chat-board:", data.chatBoardNoContent);
      setChatBoardNoContent(data.chatBoardNoContent);
      setTimeout(() => {
        if (chatDomRef.current) {
          console.log(
            "scrollTop:",
            chatDomRef.current.scrollTop,
            "scrollHeight:",
            chatDomRef.current.scrollHeight
          );
          // scroll to bottom
          chatDomRef.current.scrollTop = chatDomRef.current.scrollHeight;
        }
      }, 0);
    });
  }, [socket]);

  const downloadFile = useMemoizedFn(
    (arraybuffer: ArrayBuffer, fileName: string) => {
      if (arraybuffer) {
        // convert arraybuffer to blob
        const blob = new Blob([arraybuffer], {
          type: "application/octet-stream",
        });
        const url = URL.createObjectURL(blob);
        // download file on h5
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  );
  return (
    <>
      <Head>
        <title>x-chat</title>
      </Head>
      <main className="p-4 h-screen max-w-[70ch] relative overflow-y-hidden flex flex-col content-center mx-auto">
        <div className="border mb-2 p-2 rounded  flex-row flex items-center justify-center gap-2 active:opacity-80 ">
          <div className="text-sm ">{`http://${localIp}:3000`}</div>
          <svg
            onClick={() => {
              setDialogVisible(true);
            }}
            className="cursor-pointer "
            viewBox="0 0 1024 1024"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
          >
            <path
              d="M832 729.6v102.4h-166.4v-102.4H537.6V537.6h128v128h166.4V537.6h128v192h-128zM64 64h422.4v422.4H64V64z m0 473.6h422.4v422.4H64V537.6z m473.6-473.6h422.4v422.4H537.6V64zM192 192v166.4h166.4V192H192z m0 473.6v166.4h166.4v-166.4H192z m473.6-473.6v166.4h166.4V192h-166.4zM537.6 832h128v128H537.6v-128z m294.4 0h128v128h-128v-128z"
              fill="currentColor"
            ></path>
          </svg>
          <Dialog
            visible={dialogVisible}
            onClose={() => {
              setDialogVisible(false);
            }}
          >
            <QRCodeCanvas
              className="border my-2"
              value={`http://${localIp}:3000`}
            />
          </Dialog>
        </div>
        {/* <div>
          <p className="mt-2">
            build server ip address:&nbsp;
            <code className={styles.code}>{localIp}</code>
          </p>
          <div>
            current device:<code className={styles.code}>{deviceId}</code>
          </div>
          <div>
            online device:
            <code className={styles.code}>{onlineClients.join("\t")}</code>
          </div>
          <QRCodeCanvas
            className="border my-2"
            value={`http://${localIp}:3000`}
          />
        </div> */}
        <div className="flex-col flex flex-1 overflow-y-scroll">
          <div
            ref={chatDomRef}
            className="flex-1 border h-full overflow-y-scroll px-4 py-2 overflow-x-hidden"
          >
            {chatBoardNoContent &&
              chatBoardNoContent.map((item, index) => {
                return (
                  <ChatBoardItem
                    key={item.timestamp}
                    deviceId={deviceId}
                    item={item}
                    onDownload={(item) => {
                      // downloadFile(item.content, item.name)
                      socket?.emit("get-file-content", item);
                      socket?.once("download-file", (data: IFileContent) => {
                        downloadFile(
                          data.content as unknown as ArrayBuffer,
                          data.name
                        );
                      });
                    }}
                  ></ChatBoardItem>
                );
              })}
          </div>
          <InputArea
            className="mt-4"
            onClear={() => {
              socket?.emit("clear-chat-board");
            }}
            onEnter={(value) => {
              console.log("value:", value);
              if (typeof value === "string") {
                socket?.emit("send-file-to-server", [
                  wrapperFileContent(
                    {
                      name: value,
                    },
                    { deviceId, type: "text" }
                  ),
                ]);
              } else if (value instanceof Array) {
                socket?.emit(
                  "send-file-to-server",
                  value.map((v) =>
                    wrapperFileContent(v, { deviceId, type: "file" })
                  )
                );
              }
            }}
          />
        </div>
      </main>
    </>
  );
}
interface IInputAreaProps {
  className?: string;
  onEnter?: (value: string | FileContent[]) => void;
  onClear?: () => void;
}
const InputArea: React.FC<IInputAreaProps> = (props) => {
  const [value, setValue] = useState("");
  const [openFileSelector, { filesContent, loading, clear }] = useFilePicker({
    readAs: "ArrayBuffer",
  });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useUpdateEffect(() => {
    if (filesContent && filesContent.length > 0) {
      console.log("filesContent:", filesContent);
      props.onEnter?.(filesContent);
      clear();
    }
  }, [filesContent]);

  return (
    <div className={`flex flex-row gap-2 ${props.className}`}>
      <textarea
        ref={inputRef}
        title="input"
        rows={1}
        className={`w-full p-2 min-h-[48px] max-h-36 text-slate-300 bg-slate-300 bg-opacity-20 resize-none focus:bg-opacity-30 focus:ring-0 focus:outline-none scroll-p-2  rounded-sm whitespace-pre `}
        placeholder="input something..."
        value={value}
        onPaste={(e) => {
          const items = e.clipboardData?.items;
          if (items) {
            for (let i = 0; i < items.length; i++) {
              const file = items[i].getAsFile();
              if (file) {
                const reader = new FileReader();
                reader.readAsArrayBuffer(file);
                reader.onload = (e) => {
                  const content = e.target?.result as ArrayBuffer;
                  const fileContent: FileContent = {
                    name: file.name,
                    content: content as unknown as any,
                    lastModified: new Date().getTime(),
                  };
                  props.onEnter?.([fileContent]);
                  console.log("fileContent on paste:", fileContent);
                };
              }
            }
          }
        }}
        onChange={(e) => {
          setValue(e.currentTarget.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            const value = e.currentTarget.value;
            if (value) {
              props.onEnter?.(value);
            }
            e.preventDefault();
            setValue("");
          }
        }}
      />
      <button
        title="send"
        onClick={openFileSelector}
        className="bg-slate-700 rounded-sm px-4 py-2 h-12 hover:bg-opacity-80 text-slate-300"
        type="submit"
      >
        <svg
          viewBox="0 0 1024 1024"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
        >
          <path
            d="M959.676507 508.078691c0-244.530272-200.372563-442.760033-447.545012-442.760033-247.172449 0-447.545012 198.22976-447.545012 442.760033 0 1.440815 0.016373 2.87856 0.030699 4.315282-0.014326 1.437745-0.030699 2.87549-0.030699 4.316306 0 244.530272 200.372563 442.760033 447.545012 442.760033 247.172449 0 447.545012-198.22976 447.545012-442.760033 0-1.440815-0.017396-2.87856-0.030699-4.316306C959.660134 510.956228 959.676507 509.519506 959.676507 508.078691zM867.215676 512.393973c-0.007163 0.584308-0.00614 1.170662-0.016373 1.753947l0.031722 0c0.008186 0.854461 0.023536 1.706875 0.023536 2.563382 0 197.981097-158.994154 358.477464-355.125113 358.477464-196.127889 0-355.123067-160.496367-355.123067-358.477464 0-0.856507 0.016373-1.708921 0.023536-2.563382l0.032746 0c-0.00921-0.583285-0.008186-1.169639-0.016373-1.753947 0.007163-0.584308 0.00614-1.170662 0.016373-1.753947l-0.032746 0c-0.007163-0.854461-0.023536-1.706875-0.023536-2.563382 0-197.981097 158.995177-358.477464 355.123067-358.477464 196.130959 0 355.125113 160.496367 355.125113 358.477464 0 0.856507-0.016373 1.708921-0.023536 2.563382l-0.031722 0C867.209536 511.223311 867.208513 511.809665 867.215676 512.393973z"
            fill="currentColor"
          ></path>
          <path
            d="M735.942887 465.159182 555.273061 465.159182 555.273061 284.489356c0-16.019859-12.986779-29.007661-29.006637-29.007661l-33.853016 0c-16.019859 0-29.007661 12.986779-29.007661 29.007661l0 180.669826L282.736944 465.159182c-16.020882 0-29.007661 12.986779-29.007661 29.007661l0 33.851992c0 16.019859 12.986779 29.007661 29.007661 29.007661l180.669826 0 0 180.670849c0 16.019859 12.986779 29.007661 29.007661 29.007661l33.853016 0c16.018835 0 29.006637-12.986779 29.006637-29.007661L555.274084 557.025473l180.669826 0c16.020882 0 29.008684-12.986779 29.008684-29.007661l0-33.851992C764.950548 478.145961 751.963769 465.159182 735.942887 465.159182z"
            fill="currentColor"
          ></path>
        </svg>
      </button>
      <button
        onClick={props.onClear}
        title="clear"
        className="bg-slate-700 rounded-sm px-4 py-2 h-12 hover:bg-opacity-80 text-slate-300"
        type="button"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M8 20v-5h2v5h9v-7H5v7h3zm-4-9h16V8h-6V4h-4v4H4v3zM3 21v-8H2V7a1 1 0 0 1 1-1h5V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3h5a1 1 0 0 1 1 1v6h-1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"
          ></path>
        </svg>
      </button>
    </div>
  );
};

interface IDialogProps {
  visible: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}
const Dialog: React.FC<IDialogProps> = (props) => {
  const visible = props.visible;
  if (!visible) return null;
  return ReactDOM.createPortal(
    <div
      onClick={() => {
        props.onClose && props.onClose();
      }}
      className="absolute bg-gray-600 top-0 left-0 h-screen w-full bg-opacity-80 z-20 flex items-center justify-center"
    >
      {props.children}
    </div>,
    document.body
  );
};
