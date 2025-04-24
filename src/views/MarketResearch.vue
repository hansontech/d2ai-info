<script setup lang="ts">
  import { ref, onMounted, onBeforeMount } from 'vue'
  import VueMarkdown from 'vue-markdown-render'
  import MarkdownIt from "markdown-it"
  import { downloadData, list } from 'aws-amplify/storage';
  import FileSaver from 'file-saver'

  // Initialize Markdown parser
  const md = new MarkdownIt();
  // Function to render Markdown as HTML
  const renderMarkdown = (text:string) => {
    return md.render(text);
  };

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
      <v-container>
        <v-row>
          <v-col style="height: 100px" class="d-flex align-end">
            <h1>Market Research Generator</h1>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <h3>
              Following are the example market reseach reports that were created by the AI agent.
            </h3>
            <hr>
          </v-col>
        </v-row>
        <!-- Second Row: Multiple v-cards -->
        <v-row v-if="reports.length > 0">
          <v-col v-for="(report) in reports" :key="report.name" cols="12" sm="12" md="6" lg="6">
            <v-card class="mx-auto bg-brown-lighten-5" max-width="600">
              <v-card-title class="text-h5">{{ report.title }}</v-card-title>
              <v-card-text class="bg-grey-lighten-4 text-body-2 scroll-area" v-html="renderMarkdown(report.abstract)"></v-card-text>
              <v-card-actions>
                <v-btn color="primary" large @click="downloadClick(report)">Download</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
</template>
<script setup lang="ts">
</script>
<script lang="ts">
  export default {
    name: 'MarketResearch'
  };
</script>

<style>
/* Optional custom styling */
.v-application {
  font-family: 'Roboto', sans-serif;
}
.scroll-area {
  max-height: 150px;
  overflow-y: auto;
}
</style>