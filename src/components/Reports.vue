<script setup lang="ts">
  import { ref, onMounted, onBeforeMount } from 'vue'
  import VueMarkdown from 'vue-markdown-render'
  import { downloadData, list } from 'aws-amplify/storage';
  import FileSaver from 'file-saver'
  // Define the type of the objects in the array
  interface Report {
    name: string;
    title: string;
    folder: string;
    abstract: string;
    pdf: string;
  }
  let reports = ref<Report[]>([])
  onMounted(async () => {
    try {
        const reportsResult = await downloadData({
                  path: 'reports/reports.json',
                  options: {
                    // Specify a target bucket using name assigned in Amplify Backend
                    bucket: "d2aiInfoStorage"
                  }
                }).result;
        let reportsList = JSON.parse(await reportsResult.body.text())['reports']
        console.log('read reports.json', reportsList)
        for (let reportItem of reportsList) {
          const reportMetaResult = await downloadData({
                  path: `reports/${reportItem['folder']}/report_meta.json`,
                  options: {
                    // Specify a target bucket using name assigned in Amplify Backend
                    bucket: "d2aiInfoStorage"
                  }
                }).result;
          let report: Report = {
            name: '',
            abstract: '', // save the content directly
            folder: reportItem['folder'],
            pdf: '',
            title: ''
          } 
          let reportMetaJsonStr = await reportMetaResult.body.text()
          let reportMetaJson = JSON.parse(reportMetaJsonStr)
          report.pdf = reportMetaJson['pdf']
          const reportAbstractResult = await downloadData({
                  path: `reports/${reportItem['folder']}/${reportMetaJson.abstract}`,
                  options: {
                    // Specify a target bucket using name assigned in Amplify Backend
                    bucket: "d2aiInfoStorage"
                  }
                }).result
          let reportAbstractStr = await reportAbstractResult.body.text()
          report.abstract = reportAbstractStr
          report.title = reportMetaJson.title

          // save to the report list structure
          reports.value.push(report) 

        }
        // console.log(reports)
      } catch (error) {
        // console.log("Error: ", error.message)
        console.log("error:", error)
      }
  })
  const downloadClick = async (report:Report) => {
      let downloadPath = `reports/${report.folder}/${report.pdf}`
      console.log('downloadClick: ', downloadPath)
      try {
        const result = await downloadData({
          path: downloadPath,
          
          options: {
            // Specify a target bucket using name assigned in Amplify Backend
            bucket: "d2aiInfoStorage"
          }
        }).result;
        let blob = await result.body.blob()
        FileSaver.saveAs(blob, report.pdf);
      } catch (error) {
        console.log(`Error: ${error}`)
      }
  };
</script>
<template>
  <v-app>
    <!-- Navigation bar -->
    <v-app-bar app color="primary" dark>
      <v-toolbar-title>AI Market Research</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn>Home</v-btn>
      <v-btn>About</v-btn>
    </v-app-bar>

    <!-- Main content with a hero section -->
    <v-main class="mt-16">
      <v-container class="mt-16">
        <v-row class="mt-16 pt-16" style="height:300px">
          <v-col>
          </v-col>
        </v-row>
        <v-row class="mt-16 pt-16">  
          <v-col v-if="reports.length > 0">
            <v-card v-for="(report) in reports" :key="report.name" elevation="2" class="pa-10 mt-4" outlined>
              <v-row align="center" justify="center">
                <h1 class="display-1">{{ report.title }}</h1>
              </v-row>
              <v-row style="border: 1px solid #000; height: 200px; overflow: auto;">
                <v-col class="ml-4 mr-4">
                  <vue-markdown class="mt-4" :source="report.abstract">
                  </vue-markdown>
                </v-col>
              </v-row>
              <v-row class="mt-6" align="center" justify="center">
                <v-btn color="primary" large @click="downloadClick(report)">Download</v-btn>
              </v-row>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- Footer -->
    <v-footer app color="primary" dark>
      <v-col class="text-center white--text">© 2024 D2AI</v-col>
    </v-footer>
  </v-app>
</template>
<script setup lang="ts">
</script>
<script lang="ts">
  export default {
    name: 'Reports'
  };
</script>

<style>
/* Optional custom styling */
.v-application {
  font-family: 'Roboto', sans-serif;
}
</style>