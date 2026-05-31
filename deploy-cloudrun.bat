@echo off
call "%USERPROFILE%\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run deploy nemu-ai --source . --region asia-southeast2 --platform managed --allow-unauthenticated --port 8080
