import { useEffect, useRef } from "react";
import io, { Socket } from 'socket.io-client'
import { useMount } from "ahooks";
export function useSocket(id: string | null, ip: string, port = 3000) {
    const socket = useRef<Socket | null>(null)
    useMount(() => {
        if (socket.current) return
        socket.current = io(`http://${ip}:${port}`);
        // socket.current?.on('online-clients', (newMessage) => {
        //     console.log(newMessage);
        // });
    })
    useEffect(() => {
        if (!id) return
        socket.current?.emit('clientOnline', { deviceId: id })
    }, [id])
    return socket.current
}

