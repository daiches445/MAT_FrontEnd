// if (Platform.OS === 'android' && Platform.Version >= 23) {
//     PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
//         if (result) {
//             console.log("Permission is OK");
//             // this.retrieveConnected()
//         } else {
//             PermissionsAndroid.requestPermission(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION).then((result) => {
//                 if (result) {
//                     console.log("User accept");
//                 } else {
//                     console.log("User refuse");
//                 }
//             });
//         }
//     });
// }