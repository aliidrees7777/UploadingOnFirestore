import { AngularFirestoreModule } from 'angularfire2/firestore';
import { Component, OnInit } from '@angular/core';

import { AngularFireStorage } from 'angularfire2/storage';
import { AngularFireUploadTask } from 'angularfire2/storage'
import { Observable } from 'rxjs';

import { AngularFirestore } from 'angularfire2/firestore';
import { tap, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent {

   // Main task 
   task: AngularFireUploadTask;

   // Progress monitoring
   percentage: Observable<number>;
 
   snapshot: Observable<any>;

   uploadPercent: Observable < number > ;
   
   // Download URL
   downloadURL: Observable<string>;
 
   // State for dropzone CSS toggling
   isHovering: boolean;
 
   constructor(private storage: AngularFireStorage, private db: AngularFirestore) { }
 
   
   toggleHover(event: boolean) {
     this.isHovering = event;
   }
 
 
   startUpload(event: FileList) {
     // The File object
     const file = event.item(0)
 
     // Client-side validation example
     if (file.type.split('/')[0] !== 'image') { 
       console.error('unsupported file type :( ')
       return;
     }
 
     // The storage path
     const path = `test/${new Date().getTime()}_${file.name}`;
 
     // Totally optional metadata
     const customMetadata = { app: 'My AngularFire-powered PWA!' };
 
     // The main task
     this.task = this.storage.upload(path, file, { customMetadata })
 
     // Progress monitoring
     this.percentage = this.task.percentageChanges();
//     this.snapshot   = this.task.snapshotChanges()
     this.snapshot = this.task.snapshotChanges().pipe(
    tap(snap => {
      if (snap.bytesTransferred === snap.totalBytes) {
        // Update firestore on completion
        this.db.collection('photos').add( { path, size: snap.totalBytes })
      }
    })
  )
 
     // The file's download URL
     //this.downloadURL = this.task.downloadURL();
     /* const ref = this.storage.ref(path);
     this.task = ref.put(file, {customMetadata})
     
     this.downloadURL = this.task.snapshotChanges().pipe(
       filter(snap => snap.state === storage.TaskState.SUCCESS)
       switchMap(() => ref.getDownloadURL())
     ) */
     
   }

   uploadFile(event) {
    const file = event.target.files[0];
    const filePath = 'files';
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, file);
  
    // observe percentage changes
    this.uploadPercent = task.percentageChanges();
    // get notified when the download URL is available
    task.snapshotChanges().pipe(
        finalize(() => this.downloadURL = fileRef.getDownloadURL())
      )
      .subscribe()
  }

 
   // Determines if the upload task is active
   isActive(snapshot) {
     return snapshot.state === 'running' && snapshot.bytesTransferred < snapshot.totalBytes
   }

}
