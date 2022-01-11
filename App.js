import React, { useEffect, useReducer } from 'react';
import { I18nManager, ToastAndroid, Dimensions } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { DefaultTheme, Provider as PaperProvider, Provider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as colors from './styles/colors';
import * as fonts from './styles/typography';
import LinearGradient from 'react-native-linear-gradient';

import Login from './pages/login/Login';
import Register from './pages/registration/Register';
import Main from './pages/main/Main';
import SignUpBiometric from './pages/login/SignUpBiometric';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

I18nManager.allowRTL(false);
const Stack = createNativeStackNavigator();
export const manager = new BleManager();
export const BLEcontext = React.createContext();
const windowHeight = Dimensions.get('screen').height;

const theme = {
  dark: false,
  colors: {
    primary: 'tomato',
    accent: 'yellow',
    background: colors.WHITE,
  },


};

export default function App() {

  const initialState = {
    device: undefined,
    services: undefined
  }


  reducer = (state, action) => {
    switch (action.type) {
      case "device":
        return { ...state, device: action.value }
      case "services":
        return { ...state, services: action.value }
      case "logout":
        return { initialState }
      default:
        return state;
    }
  }
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    //manager = new BleManager();
    return () => {
      //Disconect();
      if (state.device) {
        manager.cancelDeviceConnection(state.device.id)
          .then(dev => {
            ToastAndroid.show("device disconnected", ToastAndroid.LONG)
            console.log("App Unmount ===", dev.localName);
          }).catch(err => {
            console.log("CATCH err App Unmount ===", err);

          });

      }
      manager.destroy();
    }
  }, [])


  const Disconect = () => {
    manager.connectedDevices(["a0b10000-e8f2-537e-4f6c-d104768a1214"])
      .then(res => {
        console.log("APP DISCONNECT RES===", res);
        res.forEach(dev => {
          dev = dev.cancelConnection();
          console.log("APP DISCONNECT CLOSED DEV===", dev.id);
        })
      })
  }

  return (
    <SafeAreaProvider>
      <BLEcontext.Provider value={{ state: state, dispatch: dispatch }}>
        <LinearGradient colors={[colors.TITLE_SHADOW, colors.TITLE_SHADOW_DARK]} style={{ flex: 1, paddingLeft: 10, paddingRight: 10 }}>
          <NavigationContainer
            theme={theme}
            
          >
            <Stack.Navigator initialRouteName="Login"
              screenOptions={
                {
                  animation: 'slide_from_left',
                  headerShown: false,
                  contentStyle: {margin:1,borderRadius:5 }
                }}>
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name="Biometric" component={SignUpBiometric} />
              <Stack.Screen name="Register" component={Register} />
              <Stack.Screen name="Main" component={Main} />
            </Stack.Navigator>
            
          </NavigationContainer>

        </LinearGradient>

      </BLEcontext.Provider>
    </SafeAreaProvider>
  )

};


// export default App;

  // useEffect(() => {

  //   console.log("APP UseEffect ====");
  //   const get_devices = async () => {
  //     await manager.connectedDevices(["a0b10000-e8f2-537e-4f6c-d104768a1214"])
  //     .then(devices=>{
  //       console.log("from connected dev " ,devices.length);
  //       devices.forEach(d => {
  //         console.log(d.id);
  //         if(d.isConnected()){
  //           console.log("is con");
  //         }
  //       });
  //     })
  //   }
  //   get_devices();
  // }, [])

  // async function ScanAndConnect() {

  //   await manager.startDeviceScan(null, null, (error, device) => {

  //     console.log("scanning");
  //     if (error) {
  //       console.log('ScanAndConnect error ============' + error.message);
  //       manager.stopDeviceScan();
  //       return;
  //     }

  //     if (device.name === "MAT") {
  //       console.log("FOUND -- Device ID = " + device.id);
  //       manager.stopDeviceScan();
  //       return device;
  //     }

  //   });
  //   manager.stopDeviceScan();
  // }