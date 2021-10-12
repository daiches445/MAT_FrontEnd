import React, { useEffect, useState, useContext } from 'react';

import { StyleSheet, View, Text, ScrollView, TextInput, SafeAreaView, ToastAndroid, Pressable, Alert ,Dimensions} from 'react-native';
import { Button } from 'react-native-paper';
import { BleManager, Device } from 'react-native-ble-plx';
import * as encoding from 'text-encoding';
import { Buffer } from 'buffer';
import { manager } from '../../App';
import { BLEcontext } from '../../App';
import FontistoIcon from 'react-native-vector-icons/Fontisto';
import Icon from 'react-native-vector-icons/FontAwesome5';
import * as fonts from '../../styles/typography';
import * as colors from '../../styles/colors';
import { color } from 'react-native-reanimated';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

export default function Home({ navigation }) {

    const BLEctx = useContext(BLEcontext);

    //const [device, SetDevice] = useState([]);
    const [deviceUID, SetDeviceUID] = useState('Not avilable');
    const [BTstate, setBtstate] = useState();
    const [isSwitchOn, setIsSwitchOn] = useState(false);
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


        let services = BLEctx.state.services;
        let device = BLEctx.state.device;

        console.log("LOVCAL SERVICES", services);
        if (services === undefined) {
            ToastAndroid.show("Services undefined", ToastAndroid.LONG)
            return;
        }
        let ignition_service_uuid = "19b10000-e8f2-537e-4f6c-d104768a1214";
        let char_uuid = "19b10001-e8f2-537e-4f6c-d104768a1214";
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
                <View style={styles.container} accessible={false}>
                    <View style={styles.header}></View>
                    <View style={styles.switch_btn_cont}>
                        <FontistoIcon.Button
                            name="motorcycle"
                            size={80}
                            color={isSwitchOn ? colors.TITLE_SHADOW : colors.light_grey}
                            backgroundColor={isSwitchOn ? "#ee9b00" : colors.light_black}
                            style={styles.switch_btn}
                            onPress={Switch}></FontistoIcon.Button>
                        <Button title="rediscover services" onPress={ReDiscoverServices}></Button>
                    </View>

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
    container:{
        backgroundColor:"red",
        flexDirection:"column",
        alignItems:"center",
        height:windowHeight
    },
    header:{
        height:windowHeight*0.2,
        borderBottomWidth:2,
        borderBottomColor:colors.BLACK,
        
    },
    title: {
        fontSize: 50,
        color: "red"
    },
    devices_view: {
        marginTop: 10
    }
    ,switch_btn_cont:{
        justifyContent:"center",
        width:windowWidth *0.6
    },switch_btn:{
        flexDirection:"column",
        width:windowWidth *0.6,
        alignSelf:"center",
        borderWidth:2,
        borderColor:colors.BLACK,
        alignItems:"center",

    }
})