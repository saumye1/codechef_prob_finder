Codechef Problems Finder

Find problems that your competitors have done and you haven't on Codechef.
Please feel free to fork and add modules for other online judges also.

How to run on your PC:

1. Install nodejs and npm on your PC, google "how to" for your own environment.
2. Go to a directory of your choice(for example "~/"), and type in the following command:
    * git clone https://github.com/saumye1/codechef_prob_finder.git
3. Now go to the folder by typing:
    * cd ~/codechef_prob_finder
4. Now install the dependent node libraries by simlpy typing:
    * npm install
5. The previous step installs all the libraries in package.json file of the repo.
6. Now type node app.js <your_codechef_handle> <other_person's_codechef_handle> [<other_person's_codechef_handle>...<others..>]
    * For example : node app.js saumye ishpreet
7. You shall now see the count and links to the problems that others have done but you haven't. That's it.