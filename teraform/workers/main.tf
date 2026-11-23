

variable "worker_count" {
  type = number
  default = 2
} 


locals{   
   workers=toset([ 
     for i in range(1, var.worker_count + 1):
     "worker-${i}"
   ])
}


provider "aws" {
  region = "ap-south-1"
  profile = "k8-initial"
}

resource "aws_key_pair" "cluster" {
   key_name = "k8-cluster"
   public_key = file("~/.ssh/k8-cluster.pub")
}




resource "aws_security_group" "ssh" {
	
     name = "kube-worker-shh"
     description = "Allow SSH"

     ingress {
        from_port = 22
        to_port = 22
        protocol = "tcp"
       cidr_blocks = ["0.0.0.0/0"]
     }
    
     egress {
        
        from_port =0 
        to_port =0 
        protocol = "-1"
       cidr_blocks = ["0.0.0.0/0"]
     }


}




resource "aws_instance" "k8-workers"{
  for_each = local.workers

  ami = "ami-02f853b31ccb5871f" 
  instance_type = "t3.small"
  
  key_name = aws_key_pair.cluster.key_name

  vpc_security_group_ids = [aws_security_group.ssh.id]


tags = {
   Name = each.key
   Role = "worker"
}

}

output "public_ip" {
  
  value = {
      for name, instance in aws_instance.k8-workers :
       name => instance.public_ip
}
}

output "ssh_command" {
value = {
      for name, instance in aws_instance.k8-workers :
       name => "ssh -i ~/.ssh/k8-cluster.pub ubuntu@${instance.public_ip}"
}
}
