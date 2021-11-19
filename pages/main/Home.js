import React, { useEffect, useState, useContext, useRef } from 'react';
import { StyleSheet, View, Text, ToastAndroid, Pressable, Alert, Dimensions, Animated, PanResponder } from 'react-native';
import { Button } from 'react-native-paper';
import { BleManager } from 'react-native-ble-plx';
import * as encoding from 'text-encoding';
import { Buffer } from 'buffer';
import { manager } from '../../App';
import { BLEcontext } from '../../App';
import FontistoIcon from 'react-native-vector-icons/Fontisto';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import Icon from 'react-native-vector-icons/FontAwesome5';
import * as fonts from '../../styles/typography';
import * as colors from '../../styles/colors';
import base64 from 'react-native-base64';
import { showLocation } from 'react-native-map-link';
import { IGNITION_SERVICE, IGNITION_SWITCH_CHAR } from '../ServicesAndCharacteristics';

import FingerprintScanner from 'react-native-fingerprint-scanner';
import * as Keychain from 'react-native-keychain';

const decoder = new encoding.TextDecoder();

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const monitor_transactionID = "monitor";

const is_connected_service_uid = "911a0000-e8f2-537e-4f6c-d104768a1214";
const is_connected_characteristic_uid = "911a0001-e8f2-537e-4f6c-d104768a1214";

const SWITCH_BUTTON_WIDTH = windowWidth * 0.5
const SWITCH_BUTTON_HEIGHT = windowWidth * 0.3
const HEADER_HEIGHT = windowWidth * 0.3

export default function Home({ navigation, route }) {

    const BLEctx = useContext(BLEcontext);

    const [BTstate, setBtstate] = useState();
    const [isSwitchOn, setIsSwitchOn] = useState(false);
    // const [services, setServices] = useState('');
    const device_id = BLEctx.state.device.id;
    const touch = useRef(new Animated.Value(HEADER_HEIGHT)).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,

            onPanResponderMove: Animated.event(
                [
                    null,
                    { dy: touch }
                ],{

                }
            ),
            onPanResponderRelease: (e) => {
                let Y = e.nativeEvent.locationY;
                console.log("release");
                if (Y > SWITCH_BUTTON_HEIGHT - 40) {
                   
                    Animated.spring(touch, {
                        useNativeDriver: false,
                        toValue: SWITCH_BUTTON_HEIGHT
                    }).start();
                }
                else {
                    
                    Animated.spring(touch, {
                        useNativeDriver: false,
                        toValue: 0
                    }).start();
                }
            }
        })
    ).current;

    useEffect(() => {

        if (!manager)
            manager = new BleManager();

        manager.state().then((s) => {
            setBtstate(s); console.log(s);
        }).catch((err) => { console.log("state error ------- " + JSON.stringify(err)); })

        // let sub;
        // MonitorConnection().then(res=>{
        //     sub = res;
        // }).catch(err=>{console.log(err);});
        const disconnect_subscription = manager.onDeviceDisconnected(device_id, (err, dev) => {
            navigation.navigate("Login");
        })

        return (() => {
            disconnect_subscription.remove();
            manager.cancelTransaction(monitor_transactionID);
        })
    }, [])

    useEffect(() => {
        const subscription = manager.onStateChange((state) => {
            setBtstate(state);
            console.log(state);
            if (state === 'PoweredOff') {
                manager.cancelTransaction(monitor_transactionID);
            }
        }, true);
        return () => subscription.remove();
    }, [manager]);


    async function Switch() {


        let services = BLEctx.state.services;
        let device = BLEctx.state.device;

        console.log("LOCAL SERVICES", services);
        if (services === undefined) {
            ToastAndroid.show("Services undefined", ToastAndroid.LONG)
            return;
        }
        let ignition_service_uuid = IGNITION_SERVICE
        let char_uuid = IGNITION_SWITCH_CHAR;
        let ignition_service = services.find(s => s.uuid === ignition_service_uuid)
        //let device = BLEctx.state.device;

        if (ignition_service === undefined) {
            console.log("IGNITION SERVICE UNDEFINED");
            return;
        }
        console.log("ignition service uuid ==== ", ignition_service.uuid);

        await ignition_service.characteristics().then(
            res => {
                let switch_char = res.find(c => c.uuid === char_uuid);

                let indicator = isSwitchOn ? new Int8Array([0]) : new Int8Array([1]);

                console.log("indicator ====", indicator);
                device.writeCharacteristicWithResponseForService(ignition_service.uuid, switch_char.uuid, Buffer.from(indicator).toString('base64'))
                    .then(res => {
                        console.log(res);
                        setIsSwitchOn(!isSwitchOn);

                    }).catch(err => { console.log("CATCH WRITE DATE  ", err); });

            }).catch(err => { console.log("CATCH CHARS ERR ======== ", err) });

    }

    async function ReDiscoverServices() {
        let device = BLEctx.state.device;
        let services = await manager.servicesForDevice(device.id);
        services.forEach(s => {
            console.log("SERVICE UUID ===", s.uuid);
        })
    }


    function Disconnect() {
        console.log('disconect');
        try {
            // manager.cancelTransaction(monitor_transactionID);
            BLEctx.state.device.cancelConnection();
            navigation.navigate("Login")

        } catch (error) {
            console.log("CATCH dissconect error =======" + JSON.stringify(error));
        }
    }


    async function MonitorConnection() {
        let serv = is_connected_service_uid;
        let char = is_connected_characteristic_uid;

        if (!device_id) {
            return;
        }
        console.log("device id from MonitorConnection func", device_id);

        return manager.monitorCharacteristicForDevice(
            device_id, serv, char,
            (err, char) => {
                if (err) {
                    console.log("Characteristic monitor error ==== ", err);
                    return;
                }
                let value_from_peripheral = char.value;
                console.log("base64 decoded", base64.decode(value_from_peripheral));
                console.log("no decode", base64.decode(value_from_peripheral));

                char.writeWithResponse(value_from_peripheral);
                char.descriptors
            }, monitor_transactionID)
    }

    async function StopIndications() {
        let indecatios_desc;
        let services = await manager.servicesForDevice(device_id);
        let serv = services.filter(s => s.uuid === is_connected_service_uid);

        await serv[0].descriptorsForCharacteristic(is_connected_characteristic_uid)
            .then((res) => {
                console.log(Buffer.from(res[0].value));
            }).catch(err => { console.log("CATCH ERR StopIndications", err); })
    }

    //============//
    //////MAIN//////
    //============//

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
                <View style={styles.container} accessible={false}>
                    <View style={styles.header}></View>
                    <View style={styles.switch_btn_cont}>
                        <Animated.View
                            // onStartShouldSetResponder={eve => true}
                            // onMoveShouldSetResponder={eve => true}

                            // onResponderMove={e => {
                            //     let Y = e.nativeEvent.locationY;
                            //     console.log("Y",Y);
                            //     // console.log("prevY",prevY.current);
                            //     prevY.current = Y;
                            //     // if (Y > 0 && Y < SWITCH_BUTTON_HEIGHT) {
                            //     //     console.log(Math.abs(prevY.current - Y));
                            //     //     if(Math.abs(prevY.current - Y) < 20)
                            //     //         {
                            //     //             prevY.current = Y;
                            //     //             touch.setValue(Y)
                            //     //         }
                            //     // }
                            // }}
                            // onResponderRelease={e => {
                            //     let Y = e.nativeEvent.locationY;
                            //     console.log("release");
                            //     if (Y > SWITCH_BUTTON_HEIGHT - 40)
                            //         Animated.spring(touch, {
                            //             useNativeDriver: false,
                            //             toValue: SWITCH_BUTTON_HEIGHT
                            //         }).start();
                            //     else {
                            //         Animated.spring(touch, {
                            //             useNativeDriver: false,
                            //             toValue: 0
                            //         }).start();
                            //     }
                            // }}

                            style={{
                                // position: "absolute",
                                // zIndex: 999,
                                // backgroundColor: "red",
                                // width: windowWidth * 0.5,
                                // height: SWITCH_BUTTON_HEIGHT,
                                // transform: [{ translateY: touch }]
                            }} />
                        <MaterialCommunityIcons.Button
                            name={isSwitchOn ? "flash" : "flash-off"}
                            size={80}
                            color={isSwitchOn ? colors.TITLE_SHADOW : colors.light_grey}
                            backgroundColor={isSwitchOn ? "#ee9b00" : colors.light_black}
                            style={styles.switch_btn}
                            onPress={Switch} />
                        <FontistoIcon.Button
                            name="map"
                            onPress={() => {

                            }}
                        />
                    </View>

                    {/* <Button onPress={ReDiscoverServices}>services</Button>
                    <Button onPress={StopIndications}>Stop indications</Button> */}
                    <Button onPress={Disconnect}>Exit</Button>

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
    container: {
        flexDirection: "column",
        alignItems: "center",
        height: windowHeight
    },
    header: {
        height: HEADER_HEIGHT,
        borderBottomWidth: 2,
        borderBottomColor: colors.BLACK,

    },
    title: {
        fontSize: 50,
        color: "red"
    },
    devices_view: {
        marginTop: 10
    },
    switch_btn_cont: {
        width: windowWidth * 0.6,
        flexDirection: "row",
        flexWrap: "nowrap",
        alignSelf: "center",
        zIndex:0
    },
    switch_btn: {
        width: windowWidth * 0.5,
        borderWidth: 2,
        borderColor: colors.BLACK,
        height: SWITCH_BUTTON_HEIGHT,
    }
})