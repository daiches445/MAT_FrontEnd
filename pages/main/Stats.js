
import React, { useEffect, useState, useContext } from 'react';
import { StyleSheet, View, Text, ToastAndroid, Pressable, Alert, Dimensions, PanResponder } from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { manager } from '../../App';
import { BLEcontext } from '../../App';
import { TEMP_CHAR, TEMP_SERVICE } from '../ServicesAndCharacteristics';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { light_grey } from '../../styles/colors';
import { TEXT_coolvetica_cond, TITLE_big_noodle_titling } from '../../styles/typography';
import base64 from 'react-native-base64';
import { decode } from 'punycode';


const monitor_transactionID = "monitor";

export default function Stats({navigation}) {
    const BLEctx = useContext(BLEcontext);
    const [BTstate, setBtstate] = useState();
    const [monitor_value,setMonitorValue] = useState();

    useEffect(async() => {

        if (!manager)
            manager = new BleManager();

        manager.state().then((s) => {
            setBtstate(s); console.log(s);
        }).catch((err) => { console.log("state error ------- " + JSON.stringify(err)); })


        
        MonitorTemp();
        

        // const disconnect_subscription = manager.onDeviceDisconnected(device_id, (err, dev) => {
        //     navigation.navigate("Login");
        // })
        
        return (() => {
            //disconnect_subscription.remove();
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


    async function MonitorTemp() {
        let device = BLEctx.state.device;

        if (device === undefined) {
            ToastAndroid.show("unable to monitor services", ToastAndroid.LONG);
            return;
        }

        console.log("device id from MonitorConnection func", device.id);

        manager.monitorCharacteristicForDevice(
            device.id, TEMP_SERVICE, TEMP_CHAR,
            (err, char) => {
                if (err) {
                    console.log("Characteristic monitor error ==== ", err);
                    return;
                }
                
                let value_from_peripheral = char.value;
                console.log(Buffer.from(value_from_peripheral));
                let converted_val = Buffer.from(value_from_peripheral).read
                setMonitorValue(converted_val);
            }, monitor_transactionID)

    }


    return (
        <View>
            <View style={styles.header}>
                <Text style={styles.title}>Stats</Text>
            </View>
            <View style={styles.stats}>
                <Text style={styles.stat_text}>X-axis :{monitor_value}</Text>
                {/* <MaterialCommunityIcons size={30} name="temperature-celsius" style={styles.stat_icon} /> */}
                {/* <Text style={styles.stat_text}>run-time: 00:03:12</Text> */}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    title: {
        fontSize: 50,
        fontFamily: TITLE_big_noodle_titling,
        left: 10
    }, header: {
        borderBottomWidth: 2,
        borderColor: light_grey
    }, stats: {
        flexDirection: "row",
        alignContent: "center",
        alignItems: "center",
        flexWrap: "wrap"
    }, stat_text: {
        fontFamily: TEXT_coolvetica_cond,
        fontSize: 30,
        margin: 10
    }, stat_icon: {
        right: 7
    }
})