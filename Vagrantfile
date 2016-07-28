# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "ubuntu/trusty32"
  config.vm.box_download_insecure = true

  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine. In the example below,
  # accessing "localhost:5000" on the host will access port 5000 on the guest machine.
  config.vm.network "forwarded_port", guest: 5000, host: 5000
  config.vm.network "forwarded_port", guest: 5858, host: 5858
  config.vm.network "forwarded_port", guest: 27017, host: 27027

  if Vagrant::Util::Platform.windows?
    config.vm.provision "shell", path: "vagrant_setup_win.sh", privileged: true
    config.vm.provision "shell", path: "pm2_start_win.sh", privileged: false, run: "always"
  else
    config.vm.provision "shell", path: "vagrant_setup.sh", privileged: true
    config.vm.provision "shell", path: "pm2_start.sh", privileged: false, run: "always"
  end

  config.vm.provision "shell", path: "log_defaults.sh", privileged: true, run: "always"

  config.vm.provider "virtualbox" do |vb|
    vb.customize ["setextradata", :id, "VBoxInternal2/SharedFoldersEnableSymlinksCreate/htdocs", "1"]
    ### Change network card to PCnet-FAST III
    # For NAT adapter
    vb.customize ["modifyvm", :id, "--nictype1", "Am79C973"]
    # For host-only adapter
    vb.customize ["modifyvm", :id, "--nictype2", "Am79C973"]
  end
end
