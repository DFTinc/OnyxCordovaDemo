Add your Onyx license key to the settings.json files (development/production/MUP).
If you want to deploy this project to an Ubuntu server using Meteor Up (MUP), copy the settings.json from the config environment folder of your choice into the app/ directory where you will execute the MUP commands.
```
cd app
mup setup
mup deploy
```

After you deploy you will need to obtain the onyx-node-bundle from Diamond Fortress Technologies (DFT).

Here is the readme from that bundle.

Install IDKit
```
dpkg -i idkit_2.72ubuntu1_amd64.deb
```

Install ONYX dependencies
```
./install-deps.sh
```

Run the following to get the IDKit HWID:
```
/usr/local/share/IDKit_PC_SDK/bin/gethwid
```

Send DFT the output of this, and they will send you a license to install.

Install the license with the following command:
```
sudo /usr/local/share/IDKit_PC_SDK/bin/linux_license_manager -d ~/path/to/your/iengine-license.lic 2
```

Now check that the license is correctly installed with

```
sudo /usr/local/share/IDKit_PC_SDK/bin/linux_license_manager -l
```

