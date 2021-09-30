import React, { useContext, useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View, PermissionsAndroid, Platform, Alert, ToastAndroid } from 'react-native';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import { BleManager, Device, Service } from 'react-native-ble-plx';
import { manager } from '../../App';
import * as encoding from 'text-encoding';
import { Buffer } from 'buffer';
import { UserContext } from './Register';
import MATCodeDialog from './MATCodeDialog';
import base64 from 'react-native-base64';

const encoder = new encoding.TextEncoder();
const decoder = new encoding.TextDecoder();

export default function BT_conn() {
    const reg_service_uid = "A8B10021-E8F2-537E-4F6C-D104768A1214";
    const temp_uuid = "28916d26-a0c7-42c4-b45c-0069ed7c37fc";

    const userCtx = useContext(UserContext);

    const [services, setServices] = useState([new Service()]);
    const [BTstate, setBtstate] = useState();
    const [device, setDevice] = useState();
    const [init_code, setInitCode] = useState("");
    const [code_dialog_visible, setCodeDialogVisible] = useState(false);

    useEffect(() => {
        if (!manager)
            manager = new BleManager();
        manager.state().then((s) => {
            setBtstate(s); console.log(s);
        }).catch((err) => { console.log("state error ------- " + JSON.stringify(err)); })

        if (Platform.OS === 'android' && Platform.Version >= 23) {
            PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
                if (result) {
                    console.log("Permission is OK");
                    // this.retrieveConnected()
                } else {
                    PermissionsAndroid.requestPermission(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
                        if (result) {
                            console.log("User accept");
                        } else {
                            console.log("User refuse");
                        }
                    });
                }
            });
        }
        //return(()=>{.()})
    }, [])

    useEffect(() => {
        const subscription = manager.onStateChange((state) => {
            setBtstate(state);
            console.log(state);
            if (state === 'PoweredOn') {
                //scanAndConnect();
                //subscription.remove();
            }
        }, true);
        return () => subscription.remove();
    }, [manager]);

    // async function ConnectToDevice(id) {

    //     console.log("connecting..");
    //     await manager.connectToDevice(id, { autoConnect: true })
    //     .then((device) => {
    //         (async () => {
    //             console.log("Connect to device ===== ", device.name);
    //             // if(device.name == "MAT") add later to distinc MAT
    //             let dev = await manager.discoverAllServicesAndCharacteristicsForDevice(id);
    //             let serv = await manager.servicesForDevice(id);
    //             console.log("DISCOVERD SERVIECS =======",serv);
    //         })
    //     }).catch((err) => { console.log("CATCH CONNECT===== ", JSON.stringify(err)); })
    // }

    async function ScanAndConnect() {

        await manager.startDeviceScan(null, null, (error, device) => {

            console.log("scanning");
            if (error) {
                console.log('ScanAndConnect error ============' + error.message);
                manager.stopDeviceScan();
                return;
            }

            if (device.name === "MAT") {
                setDevice(device);
                console.log("Device ID = " + device.id);
            }
            manager.stopDeviceScan();
        });

    }

    async function ConnectToDevice(id) {
        console.log('connecting..');

        await manager.connectToDevice(id, { autoConnect: true })
            .then((d) => {
                (async () => {
                    console.log("discover services....");

                    d = await manager.discoverAllServicesAndCharacteristicsForDevice(id)
                    const serv = await manager.servicesForDevice(id)
                    setDevice(d);
                    setServices(serv);
                    //console.log("serv 2 ==== ", serv[2]);

                })().catch((err) => { console.log("CATCH DISCOVER SERVICES =========== " + err); });
            })
            .catch((err) => { console.log('CATCH CONNETCT TO DEV ====' + JSON.stringify(err)) })
    }



    function Disconnect() {
        console.log('disconect');
        if (device === null) {
            console.log("device undifined");
            return;
        }
        try {
            device.cancelConnection().catch((err) => { "disconnection err ocuured  =========" + JSON.stringify(err) })

        } catch (error) {
            console.log("CATCH dissconect error =======" + JSON.stringify(error));
        }
    }
    // function ShowAvilableDevices(){
    //     if(avilable_devices.length > 0) 
    //         return avilable_devices.map((d, i) => { return (<Button key={i} title={d.name} onPress={() => { ConnectToDevice(d.id) }} />) })
    //     else
    //         return <Text>no devices</Text>}
    // }s




    async function SendUserData() {
        let response;
        let char_uuid = "a0b10002-e8f2-537e-4f6c-d104768a1214";
        let auth_service_uuid = "a0b10000-e8f2-537e-4f6c-d104768a1214";
        let auth_service = services.find(s => s.uuid === auth_service_uuid)

        if (auth_service === undefined) {
            console.log("AUTH SERVICE UNDEFINED");
            return;
        }


        let serv = services;
        await auth_service.characteristics().then(
            res => {

                let data = {
                    "username": userCtx.state.username,
                    "password": userCtx.state.password,
                    "uuid":userCtx.state.uuid
                }

                let msg = encoder.encode(JSON.stringify(data));
                let user_data_char = res.find(c => c.uuid === char_uuid);

                device.writeCharacteristicWithResponseForService(auth_service.uuid, res[0].uuid, Buffer.from(msg).toString('base64'))
                    .then(res => {
                        if (user_data_char.isReadable) {
                            user_data_char.read().then(res => {
                                response = base64.decode(res.value);
                                console.log(response);
                            }).finally(()=>{})
                        }
                        console.log("WRITE DATA ", res.value);

                    }).catch(err => { console.log("CATCH WRITE DATE  ", err); });
                //setCharacteristics(res)

            }).catch(err => { console.log("CATCH CHARS ERR ======== ", err) });
    }

    async function SendMATcode() {

        let response;
        let char_uuid = "a0b10003-e8f2-537e-4f6c-d104768a1214";
        let auth_service_uuid = "a0b10000-e8f2-537e-4f6c-d104768a1214";
        let serv = services;

        let auth_service = serv.find(s => s.uuid === auth_service_uuid)

        if (auth_service === undefined) {
            console.log("AUTH SERVICE UNDEFINED");
            return;
        }

        await auth_service.characteristics().then(
            res => {
                //console.log("CHARS ", res);
                let msg = encoder.encode(init_code);
                let code_char = res.find(c => c.uuid === char_uuid);

                device.writeCharacteristicWithResponseForService(auth_service.uuid, code_char.uuid, Buffer.from(msg).toString('base64'))
                    .then(res => {
                        // console.log("WRITE DATA VALUE ", res.value);

                        code_char.read().then(res => {
                            response = base64.decode(res.value);
                            console.log("FIRST RESPONSE ===== ", response);
                        }).finally(()=>{
                            if (response === "true") {
                                console.log("res == true");
    
                                setCodeDialogVisible(false);
                                SendUserData();
                            }
                            else {
                                console.log("res == false", response);
                                userCtx.dispatch({ type: "mat_code", value: false })
                            }
    
                        }).catch((err) => { console.log("CHAR READ ERROR ===", err); })



                        // while (response === "null") {
                        //     console.log("res == null");

                        //     code_char.read().then(res => {
                        //         response = base64.decode(res.value);
                        //         console.log("RESPONSE ===== ",response);
                        //     })
                        // }



                    }).catch(err => { console.log("CATCH WRITE DATE  ", err); });


            }).catch(err => { console.log("CATCH CHARS ERR ======== ", err) });
    }



    /// +++++++++ MAIN +++++++++///
    /// +++++++++ MAIN +++++++++///

    return (
        BTstate == "PoweredOn" ?
            <View style={styles.container}>
                <Text>Device name  = {device ? device.name : " undefined"}</Text>

                <Button title="show devices" onPress={ScanAndConnect} />
                <Button title="disconnect" onPress={Disconnect} />

                <MATCodeDialog
                    init_code={init_code}
                    setInitCode={setInitCode}
                    visible={code_dialog_visible}
                    setVisible={setCodeDialogVisible}
                    SendMATcode={SendMATcode} />

                {device ? <Button title={device.name} onPress={() => { ConnectToDevice(device.id) }}></Button> : console.log("FROM MAIN --- no dev")}

            </View> :
            <View>
                <Text>turn BT on</Text>
                <Button title="turn bt on" onPress={() => { (manager.enable()).catch((err) => { console.log(err) }) }} />
            </View>
    )

}



const styles = StyleSheet.create({
    container: {
        backgroundColor: "red",
        justifyContent: "space-around",
        margin: 4
    }
});

async function requestAccessFineLocationPermission() {
    const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
            title: 'Access fine location required for discovery',
            message:
                'In order to perform discovery, you must enable/allow ' +
                'fine location access.',
            buttonNeutral: 'Ask Me Later"',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK'
        }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
};



// if (isBluetoothOn)
// return (

//     <View style={styles.container}>
//         <Text>Device name  = {avilable_devices.length > 0 ? avilable_devices[0].name : "device undifined"}</Text>
//         <Button
//             title="show devices"
//             onPress={ScanAndConnect} />

//         {console.log(JSON.stringify(avilable_devices))}
//         {avilable_devices.map((d, i) => {
//             return <Button key={i} title={d.name} onPress={() => { ConnectToDevice(d.id) }} />
//         })}

//         {console.log('render')}
//     </View>

// )
// else {
// return (
//     <View>
//         <Button
//             title="turn on bt"
//             onPress={() => {
//                 try {
//                     RNBluetoothClassic.requestBluetoothEnabled()
//                 } catch (error) {

//                 }
//             }}
//         />
//         <Text>please turn bt on</Text>
//         <Text>ddd</Text>
//     </View>
// )
// }