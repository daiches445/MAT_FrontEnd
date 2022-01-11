import React, { useEffect, useState, useContext } from 'react';
import { StyleSheet, View, Text, ToastAndroid, Pressable, Alert, Dimensions, PanResponder } from 'react-native';
import { Button } from 'react-native-paper';
import { BleManager } from 'react-native-ble-plx';
import * as encoding from 'text-encoding';
import { Buffer } from 'buffer';
import { manager } from '../../App';
import { BLEcontext } from '../../App';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import * as fonts from '../../styles/typography';
import * as colors from '../../styles/colors';
import base64 from 'react-native-base64';
import { showLocation } from 'react-native-map-link';
import { IGNITION_SERVICE, IGNITION_SWITCH_CHAR, TEMP_CHAR, TEMP_SERVICE } from '../ServicesAndCharacteristics';

import Slider from 'react-native-slide-to-unlock';

const decoder = new encoding.TextDecoder();

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const monitor_transactionID = "monitor";


const SWITCH_BUTTON_WIDTH = windowWidth * 0.5
const SWITCH_BUTTON_HEIGHT = windowWidth * 0.3
const HEADER_HEIGHT = windowWidth * 0.3

export default function Home({ navigation, route }) {

    const BLEctx = useContext(BLEcontext);

    const [BTstate, setBtstate] = useState();
    const [isSwitchOn, setIsSwitchOn] = useState(false);
    const [button_disabled, setButtonDisabled] = useState(true);


    useEffect(async() => {

        if (!manager)
            manager = new BleManager();

        manager.state().then((s) => {
            setBtstate(s); console.log(s);
        }).catch((err) => { console.log("state error ------- " + JSON.stringify(err)); })


        

        const disconnect_subscription = manager.onDeviceDisconnected(BLEctx.state.device.id, (err, dev) => {
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
        return () => {
            manager.cancelTransaction(monitor_transactionID);
            subscription.remove();
        }
    }, [manager]);


    async function Switch() {

        setButtonDisabled(true)
        let services = BLEctx.state.services;
        let device = BLEctx.state.device;

        console.log("LOCAL SERVICES", services);
        if (services === undefined) {
            ToastAndroid.show("Services undefined", ToastAndroid.LONG)
            return;
        }

        let ignition_service = services.find(s => s.uuid === IGNITION_SERVICE)

        if (ignition_service === undefined) {
            console.log("IGNITION SERVICE UNDEFINED");
            return;
        }
        console.log("ignition service uuid ==== ", ignition_service.uuid);

        await ignition_service.characteristics().then(
            res => {
                let switch_char = res.find(c => c.uuid === IGNITION_SWITCH_CHAR);

                let indicator = isSwitchOn ? new Int8Array([0]) : new Int8Array([1]);

                console.log("indicator ====", indicator);
                device.writeCharacteristicWithResponseForService(ignition_service.uuid, switch_char.uuid, Buffer.from(indicator).toString('base64'))
                    .then(res => {
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
                <View style={styles.header}>
                    <Text style={styles.title}>WELCOME,Eli</Text>
                </View>
                <View style={styles.switch_btn_cont}>

                    <MaterialCommunityIcons.Button
                        disabled={button_disabled}
                        name={!isSwitchOn ? "flash" : "flash-off"}
                        size={80}
                        color={isSwitchOn ? colors.BLACK : "red"}
                        backgroundColor={button_disabled ? colors.light_grey : colors.PRIMARY}
                        style={styles.switch_btn}
                        iconStyle={{ marginLeft: 10 }}
                        onPress={Switch} />

                </View>
                <Slider
                    
                    onEndReached={() => { setButtonDisabled(false) }}
                    containerStyle={styles.slider_cont}
                    childrenContainer={styles.slider_cont_chd}
                    sliderElement={
                        <View style={styles.slider}>
                        </View>
                    }>
                    <Text style={styles.slider_text}>slide to unlock button</Text>
                </Slider>
                <Button style={styles.disconnect} onPress={Disconnect}>Exit</Button>


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
    },
    title: {
        fontSize: 50,
        color: "black",
        fontFamily: fonts.TITLE_big_noodle_titling
    },
    devices_view: {
        marginTop: 10
    },
    switch_btn_cont: {
        flexDirection: "row",
        alignSelf: "center",
        margin: 4
    },
    switch_btn: {
        borderWidth: 2,
        borderColor: colors.light_grey,
        height: SWITCH_BUTTON_HEIGHT,
    },
    slider_cont: {
        margin: 8,
        borderRadius: 10,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        width: '70%',
        backgroundColor: colors.tab_backround,
        borderWidth: 2,
        borderColor: colors.light_black,

    },
    slider:
    {
        backgroundColor: "#dc2f02",
        width: 50,
        height: 30,
        borderRadius: 10,
        margin: 4
    },
    slider_text: {
        fontFamily: fonts.TITLE_big_noodle_titling,
    },
    disconnect: {
        marginTop: 200
    }
})