import Head from "next/head";
import Image from "next/image";
import { Inter } from "next/font/google";
import ip from "ip";
import styles from "@/styles/Home.module.css";
import { useSocket } from "@/hooks/useSocket";
import { useDeviceId } from "@/hooks/useDeviceId";
import { useMemoizedFn, useMount, useUpdate, useUpdateEffect } from "ahooks";
import { useEffect, useRef, useState } from "react";
import { FileContent, useFilePicker } from "use-file-picker";
import { QRCodeCanvas } from 'qrcode.react';

const inter = Inter({ subsets: ["latin"] });
interface IFileContent extends FileContent {
  timestamp: number
}
interface IStaticProps {
  localIp: string;
  port: number;
}

function wrapperFileContent(fileContent: FileContent) {
  return {
    ...fileContent,
    timestamp: Date.now(),
  }
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

export default function Home({ localIp, port }: IStaticProps) {
  const { deviceId } = useDeviceId();
  const socket = useSocket(deviceId, localIp, port);
  const [onlineClients, setOnlineClients] = useState<string[]>([]);
  const [openFileSelector, { filesContent, loading }] = useFilePicker({
    readAs: "ArrayBuffer",
  });
  // const temptFile = useRef<IFileContent | null>()
  useUpdateEffect(() => {
    socket?.on("online-clients", (data) => {
      console.log("online-clients:", data);
      setOnlineClients(data.onlineClients);
    });
  }, [socket]);

  useUpdateEffect(() => {
    if (filesContent && filesContent.length > 0) {
      console.log("filesContent:", filesContent);
      socket?.emit("send-file", filesContent);
    }
  }, [filesContent, socket]);

  const downloadFile = useMemoizedFn(() => {
    const file = filesContent && filesContent[0];
    if (file) {
      // convert arraybuffer to blob
      const blob = new Blob([file.content], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      // download file on h5
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  })
  return (
    <>
      <Head>
        <title>x-chat</title>
      </Head>
      <main className="p-4">
        <div>
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
          <QRCodeCanvas className="border my-2" value={`http://${localIp}:3000`} />
        </div>
        <div>
          <input
            className="cursor-pointer border p-2 rounded-xl hover:opacity-90 active:opacity-70"
            title=""
            type="button"
            value="pick up file"
            onClick={openFileSelector}
          />
          <input
            className="cursor-pointer border p-2 rounded-xl hover:opacity-90 active:opacity-70 ml-4"
            title=""
            type="button"
            value="download file"
            onClick={() => { downloadFile() }}
          />
          <div>
            {loading && <div>loading...</div>}
            {filesContent &&
              filesContent.map((item) => {
                return (
                  <div key={item.name}>
                    <div>{item.name}</div>
                  </div>
                );
              })}
          </div>
        </div>
        <div></div>
      </main>
    </>
  );
}
