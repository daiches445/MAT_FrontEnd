import React, { useEffect, useState, useContext } from 'react';

import { Platform, PermissionsAndroid, StyleSheet, View, Text, ScrollView, TextInput, Button, SafeAreaView, ToastAndroid, Pressable, Alert } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { encode as btoa } from 'react-native-base64'
import * as encoding from 'text-encoding';
import { Buffer } from 'buffer';
import { manager } from '../../App';
import { BLEcontext } from '../../App';
import Icon from 'react-native-vector-icons/FontAwesome5';

//const manager = new BleManager();
const encoder = new encoding.TextEncoder();

export default function Home({ navigation }) {

    const BLEctx = useContext(BLEcontext);

    const [device, SetDevice] = useState([]);
    const [deviceUID, SetDeviceUID] = useState('Not avilable');
    const [BTstate, setBtstate] = useState();
    const [isSwitchOn,setIsSwitchOn] = useState(false);
    // const [services, setServices] = useState('');

    useEffect(() => {

        if (!manager)
            manager = new BleManager();

        manager.state().then((s) => {
            setBtstate(s); console.log(s);
        }).catch((err) => { console.log("state error ------- " + JSON.stringify(err)); })


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


    async function Switch() {

        const services = BLEctx.state.services;
        if (services === undefined) {
            ToastAndroid.show("Services undefined",ToastAndroid.LONG)
            return;
        }
        let response;
        let ignition_service_uuid = "19b10000-e8f2-537e-4f6c-d104768a1214";
        let char_uuid = "19b10001-e8f2-537e-4f6c-d104768a1214";
        let ignition_service = services.find(s => s.uuid === ignition_service_uuid)

        if (ignition_service === undefined) {
            console.log("AUTH SERVICE UNDEFINED");
            return;
        }

        await ignition_service.characteristics().then(
            res => {
                let switch_char = res.find(c => c.uuid === char_uuid);
                let on_off = isSwitchOn?0:1;
                device.writeCharacteristicWithResponseForService(ignition_service.uuid, switch_char.uuid,on_off)
                    .then(res => {
                        setIsSwitchOn(!isSwitchOn);

                    }).catch(err => { console.log("CATCH WRITE DATE  ", err); });
                //setCharacteristics(res)

            }).catch(err => { console.log("CATCH CHARS ERR ======== ", err) });

        return false;
    }

    async function ReDiscoverServices(){
        let device = BLEctx.state.device;
        let services  = await manager.servicesForDevice(device.id);
        services.forEach(s=>{
            console.log("SERVICE UUID ===",s.uuid);
        })
    }


    function Disconnect() {
        console.log('disconect');
        try {
            BLEctx.state.device.cancelConnection()
                .then(closed_dev => {
                    navigation.navigate('Login');
                })
                .catch((err) => {
                    "disconnection err ocuured  =========" + JSON.stringify(err)
                });
        } catch (error) {
            console.log("CATCH dissconect error =======" + JSON.stringify(error));
        }
    }

    if (BLEctx.state.device === undefined) {
        ToastAndroid.show("device undifined", ToastAndroid.LONG)
        return (
            <View>
                {navigation.navigate("Login")}
            </View>
        )
    }
    else {
        return (
            BTstate === "PoweredOn" ?
                <View>

                    {/* {device === undefined?<Text>device undfined</Text>:console.log(characteristics)} */}
                    <Text>{BTstate}</Text>
                    {/* <Text>Device name  = {BLEctx.state.device !== undefined ? device.name : "device undifined"}</Text> */}
                    {/* <Text>Device ID  = {deviceUID}</Text> */}
                    <Icon.Button
                        onPress={Switch}
                        name="fire"
                        size={50}
                        color="black"
                        backgroundColor="rgba(255, 0, 0, 0)"
                        style={{ flexDirection: "column", width: 100, alignSelf: "center" }}
                    >
                        TURN  ON
                    </Icon.Button>
                    <Button title="rediscover services" onPress={ReDiscoverServices}></Button>

                    <Button title="Exit" onPress={Disconnect}></Button>

                </View>
                :
                <View>
                    <Text>turn BT on</Text>
                    <Button title="turn bt on" onPress={() => { (manager.enable()).catch((err) => { console.log(err) }) }} />
                </View>

        )
    }
}

const styles = StyleSheet.create({
    title: {
        fontSize: 50,
        color: "red"
    },
    devices_view: {
        marginTop: 10
    }
})


    // function getServicesAndCharacteristics(dev) {
    //     return new Promise((resolve, reject) => {
    //         dev.services().then(services => {
    //             const characteristics = []
    //             console.log("ashu_1", services)
    //             services.forEach((service, i) => {
    //                 service.characteristics().then(c => {
    //                     console.log("service.characteristics")

    //                     characteristics.push(c)
    //                     console.log(characteristics)
    //                     if (i === services.length - 1) {
    //                         const temp = characteristics.reduce( 
    //                             (acc, current) => {
    //                                 return [...acc, ...current]
    //                             },
    //                             []
    //                         )
    //                         const dialog = temp.find(
    //                             characteristic =>
    //                                 characteristic.isWritableWithoutResponse
    //                         )
    //                         if (!dialog) {
    //                             reject('No writable characteristic')
    //                         }
    //                         resolve(dialog)
    //                     }

    //                 })
    //             })
    //         })
    //     })
    // }
    // async function scanAndConnect() {

    //     await manager.startDeviceScan(null, null, (error, device) => {
    //         let dev_lst = device_lst;
    //         console.log("scanning");
    //         if (error) {
    //             console.log('ScanAndConnect error ============' + error.androidErrorCode);
    //             manager.stopDeviceScan();
    //             return;
    //         }
    //         console.log("Device ID = " + device.id);
    //         SetDeviceLst(dev_lst);
    //         SetDevice(device);
    //         manager.stopDeviceScan();

    //     });
    // }