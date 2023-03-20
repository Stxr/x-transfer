import { useMemoizedFn, useUpdateEffect } from "ahooks";
import clsx from "clsx";
import { useState } from "react";

interface ICopyProps {
  text: string;
  visible?: boolean;
}
export function Copy(props: ICopyProps) {
  const [text, setText] = useState<string>("copy");
  const [active, setActive] = useState<boolean>(props.visible || false);

  useUpdateEffect(() => {
    setActive(props.visible || false);
  }, [props.visible]);

  const copyText = useMemoizedFn((text: string) => {
    const input = document.createElement("input");
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
  });

  return (
    <button
      onClick={async () => {
        copyText(props.text);
        setText("copied");
        setTimeout(() => {
          setText("copy");
        }, 1000);
      }}
      className={clsx(
        "bg-gray-300 px-2 right-0 absolute h-6 bottom-0 rounded text-gray-700 opacity-0 ",
        active && "transition-opacity opacity-100 duration-300"
      )}
      type="button"
      title="copy"
    >
      {text}
    </button>
  );
}
