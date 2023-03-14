import { createShortId } from '@/utils/utils';
import { useMount } from 'ahooks';
import { useState } from 'react';
const useDeviceId = () => {
    const key = 'x-chat-device-id'
    const [deviceId, setDeviceId] = useState<string | null>(null);
    useMount(() => {
        let _deviceId = localStorage.getItem(key);
        setDeviceId(_deviceId)
        // if _deviceId exist, return. otherwise, create a new one
        if (_deviceId) return;
        _deviceId = createShortId()
        localStorage.setItem(key, _deviceId)
        setDeviceId(_deviceId)
    })
    return { deviceId, setDeviceId };
}
export { useDeviceId };