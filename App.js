import React, { useEffect, useReducer } from 'react';
import { I18nManager } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

//import type {Node} from 'react';

import Login from './pages/login/Login';
import Register from './pages/registration/Register';
import Main from './pages/main/Main';

I18nManager.allowRTL(false);
const Stack = createNativeStackNavigator();
export const manager = new BleManager();
export const BLEcontext = React.createContext();

export default function App() {


  const initialState = {
    device: undefined,
    services: undefined
  }

  reducer = (state, action) => {
    switch (action.type) {
      case "device":
        console.log("device has changed in APP =====");
        return { ...state, device: action.value }
      case "services":
        return { ...state, services: action.value }
      default:
        return state;
    }
  }
  const [state, dispatch] = useReducer(reducer, initialState)





  return (
    <BLEcontext.Provider value={{ state: state, dispatch: dispatch }}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="Main" component={Main} />
        </Stack.Navigator>
      </NavigationContainer>
    </BLEcontext.Provider>
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