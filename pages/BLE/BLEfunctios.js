import React from 'react'
import { manager } from "../../App";


export async function ConnectToDevice(id) {
    console.log('connecting..');

    await manager.connectToDevice(id, { autoConnect: true })
        .then((d) => {
            (async () => {
                console.log("discover services....");

                const d = await manager.discoverAllServicesAndCharacteristicsForDevice(id)
                const serv = await manager.servicesForDevice(id)

                return({'device':d,'services':serv})

            })().catch((err) => { console.log("CATCH DISCOVER SERVICES =========== " + err); });
        })
        .catch((err) => { console.log('CATCH CONNETCT TO DEV ====' + JSON.stringify(err)) })
}


export async function ScanAndConnect() {

    await manager.startDeviceScan(null, null, (error, device) => {

        console.log("scanning");
        if (error) {
            console.log('ScanAndConnect error ============' + error.message);
            manager.stopDeviceScan();
            return;
        }

        if (device.name === "MAT") {
            // BLECtx.dispatch({type:"device",device});
            console.log("FOUND -- Device ID = " + device.id);
            manager.stopDeviceScan();
            return device;
        }
        
    });
    manager.stopDeviceScan();
}


export function Disconnect(device) {
    console.log('disconect');
    if (!device) {
        console.log("device undifined");
        return;
    }

    try {
        device.cancelConnection().catch((err) => { "disconnection err ocuured  =========" + JSON.stringify(err) })

    } catch (error) {
        console.log("CATCH dissconect error =======" + JSON.stringify(error));
    }
}