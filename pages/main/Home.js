import React, { useEffect, useState } from 'react';

import { Platform, PermissionsAndroid, StyleSheet, View, Text, ScrollView, TextInput, Button, SafeAreaView, ToastAndroid, Pressable, Alert } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import RNBluetoothClassic from 'react-native-bluetooth-classic';
import {encode as btoa} from 'react-native-base64'
import * as encoding from 'text-encoding';
import { Buffer  } from 'buffer';
import { manager } from '../../App';
//const manager = new BleManager();
const encoder  = new encoding.TextEncoder();

export default function Home() {
    const [device, SetDevice] = useState(new Device());
    const [device_lst, SetDeviceLst] = useState([]);
    const [deviceUID, SetDeviceUID] = useState('Not avilable');
    const [BTstate, setBtstate] = useState();
    const [services, setServices] = useState('');
    const [characteristics, setCharacteristics] = useState();

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

    async function scanAndConnect() {

        await manager.startDeviceScan(null, null, (error, device) => {
            let dev_lst = device_lst;
            console.log("scanning");
            if (error) {
                console.log('ScanAndConnect error ============' + error.androidErrorCode);
                manager.stopDeviceScan();
                return;
            }
            dev_lst.push({ id: device.id, name: device.name });
            console.log("Device ID = " + device.id);
            SetDeviceLst(dev_lst);
            SetDevice(device);
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
                    await serv[2].characteristics().then(
                        
                        res=>{console.log("CHARS ",res);
                        let txt  = encoder.encode("hello");
                        console.log(txt);

                        d.writeCharacteristicWithResponseForService(serv[2].uuid,res[0].uuid, Buffer.from(txt).toString('base64'))
                        .then(res=>{
                            console.log("WRITE DATA ",res);
                        }).catch(err=>{console.log("CATCH WRITE DATE  ",err);});
                        setCharacteristics(res)
                    
                    }).catch(err=>{console.log("CATCH CHARS ERR ======== ",err)});
                    setServices(serv);
                    console.log("services =========== " , serv[2]);
                    

                })().catch((err) => { console.log("CATCH DISCOVER SERVICES =========== " + err); });
            })
            .catch((err) => { console.log('CATCH CONNETCT TO DEV ====' + JSON.stringify(err)) })

        // let sfd = manager.servicesForDevice(id).then((s)=>{
        //     console.log("SFD ===== "+ s);

        // }).catch((err) =>{console.log("SFD -------"+err)});


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
    function getServicesAndCharacteristics(dev) {
        return new Promise((resolve, reject) => {
            dev.services().then(services => {
                const characteristics = []
                console.log("ashu_1", services)
                services.forEach((service, i) => {
                    service.characteristics().then(c => {
                        console.log("service.characteristics")

                        characteristics.push(c)
                        console.log(characteristics)
                        if (i === services.length - 1) {
                            const temp = characteristics.reduce( 
                                (acc, current) => {
                                    return [...acc, ...current]
                                },
                                []
                            )
                            const dialog = temp.find(
                                characteristic =>
                                    characteristic.isWritableWithoutResponse
                            )
                            if (!dialog) {
                                reject('No writable characteristic')
                            }
                            resolve(dialog)
                        }

                    })
                })
            })
        })
    }


    return (
        BTstate === "PoweredOn" ?
            <View>

                {/* {device === undefined?<Text>device undfined</Text>:console.log(characteristics)} */}
                <Text>{BTstate}</Text>
                <Text>Device name  = {device !== undefined ? device.name : "device undifined"}</Text>
                <Text>Device ID  = {deviceUID}</Text>
                <Button title="scanAndConnect" onPress={scanAndConnect}></Button>
                <Button title="log char" onPress={() => { console.log(characteristics) }}></Button>
                <Button title="log serv" onPress={() => { console.log(sevices) }}></Button>
                {/* <Button title="is connected" onPress={() => { manager.connectedDevices([deviceUID]).then((d)=>{console.log(d)}).catch((e)=>{console.log(e)})}}></Button> */}
                <Button title="disconnect" onPress={Disconnect}></Button>

                {device_lst.map((dev, idx) => { return (<Button key={idx} title={String(dev.name)} onPress={() => { ConnectToDevice(dev.id) }} />) })}
                {console.log('FROM MAIN ------' + JSON.stringify(device_lst))}

            </View>
            :
            <View>
                <Text>turn BT on</Text>
                <Button title="turn bt on" onPress={() => { (manager.enable()).catch((err) => { console.log(err) }) }} />
            </View>

    )
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
