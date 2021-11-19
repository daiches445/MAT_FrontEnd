import React, { useContext, useEffect, useState, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Dimensions, PermissionsAndroid, Platform, Alert, ToastAndroid, useWindowDimensions } from 'react-native';
import { Button } from 'react-native-paper'

import { BleManager, Service } from 'react-native-ble-plx';
import { manager } from '../../App';
import * as encoding from 'text-encoding';
import { Buffer } from 'buffer';
import base64 from 'react-native-base64';
import * as fonts from '../../styles/typography'

import MATCodeDialog from './MATCodeDialog';
import BluetoothOffDialog from './BluetoothOffDialog';

import { UserContext } from './Register';
import { BLEcontext } from '../../App';

import ScanAnimation from './ScanAnimation';
import { AUTH_SERVICE, REGISTER_CHAR } from '../ServicesAndCharacteristics';


const encoder = new encoding.TextEncoder();
const decoder = new encoding.TextDecoder();


export default function DeviceSearch({ navigation }) {



    const userCtx = useContext(UserContext);
    const BLEctx = useContext(BLEcontext);

    //const [services, setServices] = useState([new Service()]);
    const [BTstate, setBtstate] = useState();
    //const [device, setDevice] = useState();
    const [init_code, setInitCode] = useState("");
    const [code_dialog_visible, setCodeDialogVisible] = useState(false);
    const [is_device_connected, setIs_device_connected] = useState(false,()=>{
        if(!is_device_connected)
            ScanAndConnect();
    });


    useEffect(() => {
        if (!manager)
            manager = new BleManager();
        manager.state().then((s) => {
            if (s === 'PoweredOn')
                ScanAndConnect();

            setBtstate(s);
            console.log("BT state, DeviceSearch", s);
        }).catch((err) => { console.log("state error ------- " + JSON.stringify(err)); })

    }, [])

    useEffect(() => {
        const subscription = manager.onStateChange((state) => {
            setBtstate(state);

            if (state === 'PoweredOn') {
                ScanAndConnect();
            }

        }, true);
        return () => subscription.remove();
    }, [manager]);


    async function ScanAndConnect() {

        await manager.startDeviceScan(null, null, (error, device) => {

            console.log("scanning");
            if (error) {
                console.log('ScanAndConnect error ============' + error.message);
                manager.stopDeviceScan();
                return;
            }

            if (device.name === "MAT") {
                manager.stopDeviceScan();
                BLEctx.dispatch({ type: "device", value: device })
                console.log("ScanAndConnect func, Device ID = " + device.id);

                ConnectToDevice(device.id)
            }
        });

    }

    async function ConnectToDevice(id) {
        console.log('connecting..');

        await manager.connectToDevice(id, { autoConnect: true })
            .then((d) => {
                (async () => {
                    console.log("discover services....");
                    setIs_device_connected(true);
                    //d = await manager.discoverAllServicesAndCharacteristicsForDevice(id)
                    const serv = await manager.servicesForDevice(id)
                    //setDevice(d);
                    //setServices(serv);
                    console.log(serv[0]);
                    BLEctx.dispatch({ type: 'device', value: d })
                    BLEctx.dispatch({ type: 'services', value: serv })

                })().catch((err) => { console.log("CATCH DISCOVER SERVICES ===== " + err); });
            })
            .catch((err) => { console.log('CATCH CONNETCT TO DEV ====' + JSON.stringify(err)) })
    }


    async function SendUserData() {
        let response;
        let char_uuid = REGISTER_CHAR;
        let auth_service_uuid = AUTH_SERVICE;

        let auth_service = BLEctx.state.services.find(s => s.uuid === auth_service_uuid)

        if (auth_service === undefined) {
            console.log("AUTH SERVICE UNDEFINED");
            return;
        }

        await auth_service.characteristics().then(
            res => {

                let data = {
                    "username": userCtx.state.username,
                    "password": userCtx.state.password,
                    "uuid": userCtx.state.uuid
                }

                let msg = encoder.encode(JSON.stringify(data));
                let user_data_char = res.find(c => c.uuid === char_uuid);

                device.writeCharacteristicWithResponseForService(auth_service.uuid, res[0].uuid, Buffer.from(msg).toString('base64'))
                    .then(res => {
                        if (user_data_char.isReadable) {
                            user_data_char.read().then(res => {
                                response = base64.decode(res.value);
                                console.log(response);
                            }).finally(() => { 

                            })
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
        
        let auth_service = BLEctx.state.services.find(s => s.uuid === auth_service_uuid)

        if (auth_service === undefined) {
            console.log("AUTH SERVICE UNDEFINED");
            return;
        }

        await auth_service.characteristics().then(
            res => {
                //console.log("CHARS ", res);
                let msg = encoder.encode(init_code);
                let code_char = res.find(c => c.uuid === char_uuid);
                let device = BLEctx.state.device;

                device.writeCharacteristicWithResponseForService(auth_service.uuid, code_char.uuid, Buffer.from(msg).toString('base64'))
                    .then(res => {
                        // console.log("WRITE DATA VALUE ", res.value);

                        code_char.read().then(res => {
                            response = base64.decode(res.value);
                            console.log("FIRST RESPONSE ===== ", response);
                        }).finally(() => {
                            if (response === "true") {
                                console.log("res == true");

                                //setCodeDialogVisible(false);
                                SendUserData();
                            }
                            else {
                                console.log("res == false", response);
                                userCtx.dispatch({ type: "mat_code", value: false })
                            }

                        }).catch((err) => { console.log("CHAR READ ERROR ===", err); })
                    }).catch(err => { console.log("CATCH WRITE DATE  ", err); });
            }).catch(err => { console.log("CATCH CHARS ERR ======== ", err) });
    }

    function handleCancel() {
        navigation.navigate("Login")
    }

    /// +++++++++ MAIN +++++++++///
    /// +++++++++ MAIN +++++++++///

    return (

        <View style={styles.container}>
            <Text style={styles.title}> device scan </Text>
            <Text>turn MAT on.</Text>
            {is_device_connected ?
             <MATCodeDialog
                is_device_connected={is_device_connected}
                setIs_device_connected={setIs_device_connected}
                init_code={init_code}
                setInitCode={setInitCode}
                SendMATcode={SendMATcode} />
                 :
                 <ScanAnimation />}

            <BluetoothOffDialog BTstate={BTstate} handleCancel={handleCancel} />

        </View>

    )

}


const styles = StyleSheet.create({
    container: {
    },
    title: {
        fontFamily: fonts.TITLE_big_noodle_titling,
        fontSize: 50,
        textAlign: 'center',
        margin: 20
    },
    no_bt_view: {
        alignItems: "center"
    },
    no_bt_txt: {
        fontFamily: fonts.TITLE_big_noodle_titling,
        fontSize: 20,
        margin: 40
    },
    no_bt_btn: {
        fontWeight: "bold",
        color: "black",
        right: 40
    }
});

// async function requestAccessFineLocationPermission() {
//     const granted = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//         {
//             title: 'Access fine location required for discovery',
//             message:
//                 'In order to perform discovery, you must enable/allow ' +
//                 'fine location access.',
//             buttonNeutral: 'Ask Me Later"',
//             buttonNegative: 'Cancel',
//             buttonPositive: 'OK'
//         }
//     );
//     return granted === PermissionsAndroid.RESULTS.GRANTED;
// };



//if (Platform.OS === 'android' && Platform.Version >= 23) {
    //     PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
    //         if (result) {
    //             console.log("Permission is OK");
    //             // this.retrieveConnected()
    //         } else {
    //             PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
    //                 if (result) {
    //                     console.log("User accept");
    //                 } else {
    //                     console.log("User refuse");
    //                 }
    //             });
    //         }
    //     });
    // }