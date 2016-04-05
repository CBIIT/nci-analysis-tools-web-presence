import os
import sys
import subprocess
from datetime import datetime
from datetime import timedelta

def upload_file(request, itemName, fileSavePath):
    UPLOAD_FOLDER = fileSavePath
    startTime = datetime.now()
    file = request.files[itemName]
    file.save(os.path.join(UPLOAD_FOLDER, file.filename))
    result = subprocess.check_output(["file", fileAbsPath])
    type = result.split(':')[1].split(',')[0].strip()
    if type == 'ASCII text':
        print ('OK')
    else:
        subprocess.call(["rm",fileAbsPath])
        print('Not OK')
        return "You must upload a text or csv file"

    endTime =  datetime.now()
    dt =  endTime - startTime
    ms = (dt.days * 24 * 60 * 60 + dt.seconds)*1000 + dt.microseconds / 1000
    print "Time for uploading file is {0} second.".format(ms) 
    return "File Upload is complted"
