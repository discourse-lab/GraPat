# Workflow for annotating argumentation structure with GraPAT

The basic workflow for annotating new texts in GraPAT and exporting the annotations to PAX is as follows:

1. Provide a segmented txt-file for each text.
2. Convert the texts into GraPAT's input format.
3. Make them available to GraPAT.
4. Annotate.
5. Export annotation from GraPATs database into PAX format.



## Setup environment

For running the conversion scripts you need a python environment with some libraries installed. The easiest way to achieve this without messing around system-wise is using virtualenv.

	cd GraPAT

	virtualenv env

	env/bin/pip install --upgrade pip

	env/bin/pip install lxml pymysql peewee


Note that lxml might require some xml system libraries installed:

	sudo apt-get install libxml2-dev libxslt-dev python-dev



## Convert text files into GraPAT input format

	env/bin/python text_to_grapat_xml.py --help

	env/bin/python text_to_grapat_xml.py *.txt

Then add these xml files to the place where GraPAT has its data-files. In my case this is /var/lib/tomcat7/webapps/grapat/data/. Make sure that tomcat has the rights to read them.



## Annotate in GraPat

If you are already logged into GraPAT, make a hard refresh in the browser (e.g. CTRL-F5). Find the new files in the file selection dropdown. If they are not there, check that the deployed GraPAT has access to the files in its data folder. Restarting the webapp is usually not necessary.



## Convert GraPAT annotation into PAX xml format

GraPAT stores it's annotations for each user as json-string in a mysql database. This is what you want to retrieve and convert into the PAX argumentation graph format. The sql database does not hold the actual text, so our script needs access both to the sql db and to the folder that contains the input xml files, we generated in prior steps.

	mkdir arggraphs

	env/bin/python grapat_to_pax.py --help

	env/bin/python grapat_to_pax.py --text-folder /var/lib/tomcat7/webapps/grapat/data/ --output-folder arggraphs USERNAME ehe-fuer-alle.pro ehe-fuer-alle.con
