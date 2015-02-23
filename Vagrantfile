# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "ubuntu/trusty64"

  # Create a forwarded port mapping which allows access to a specific port
  # within the machine from a port on the host machine. In the example below,
  # accessing "localhost:3000" on the host will access port 3000 on the guest machine.
  config.vm.network "forwarded_port", guest: 3000, host: 3000
  config.vm.network "forwarded_port", guest: 27017, host: 27027

  # Enable provisioning with chef solo
  # see http://berkshelf.com/ for details of this
  # end
  config.berkshelf.enabled = true
  
  config.vm.provision :chef_solo do |chef|
    chef.add_recipe "git"
    chef.add_recipe "nodejs"
    chef.add_recipe "mongodb::mongodb_org_repo"
    chef.add_recipe "mongodb::default"
    chef.add_recipe "grunt_cookbook::install_grunt_cli"
  end

  config.vm.provision "shell", path: "vagrant_setup.sh"

end
