

provider "aws"{
region = "ap-south-1"
profile = "k8-initial"
}




resource "aws_security_group" "ssh" {
       name = "kube-control-plane-ssh"
       description = "Allow SSH"


 ingress {
      from_port = 22
      to_port =22
     protocol = "tcp"
     cidr_blocks = ["0.0.0.0/0"]
} 

egress {
      from_port = 0
      to_port =0
     protocol = "-1"
     cidr_blocks = ["0.0.0.0/0"]
}
}


resource "aws_instance" "k8-control-plane"{

   ami="ami-02f853b31ccb5871f"
   instance_type="c7i-flex.large"
   key_name = "k8-cluster" 
   vpc_security_group_ids = [aws_security_group.ssh.id]

   tags = {
Name = "control-plane"
Role = "control-plane"
}
}

output "ssh_command" {
 value = "ssh -i ~/.ssh/k8-cluster ubuntu@${aws_instance.k8-control-plane.public_ip}"
}











